import { resolveRuleBased, normalizeText, type AiSuggestion } from "./rule-based";
import { resolveWithLlm } from "./llm";
import { getAiProvider, hasLlmApiKey } from "@/lib/settings.service";
import { listEquipment } from "@/lib/equipment.service";
import type { Category, EquipmentCondition } from "@/generated/prisma/client";

export type KitProvider = "llm" | "rule-based";

export interface CatalogEquipment {
  id: string;
  name: string;
  categoryId: string;
  category: Category;
  imageUrl: string | null;
  totalQty: number;
  availableQty: number;
  condition: EquipmentCondition;
  isActive: boolean;
}

export interface KitResultItem {
  suggestion: AiSuggestion;
  equipment: CatalogEquipment | null;
  matched: boolean;
  available: boolean;
  /** how much of the requested quantity can actually be borrowed */
  borrowable: number;
  alternatives: CatalogEquipment[];
}

export interface KitSummary {
  total: number;
  available: number;
  outOfStock: number;
  notInCatalog: number;
  /** total units of the kit that can actually be borrowed right now */
  borrowableUnits: number;
}

export interface KitResult {
  provider: KitProvider;
  providerLabel: string;
  items: KitResultItem[];
  summary: KitSummary;
}

function summarize(items: KitResultItem[]): KitSummary {
  return {
    total: items.length,
    available: items.filter((item) => item.available).length,
    outOfStock: items.filter((item) => item.matched && !item.available).length,
    notInCatalog: items.filter((item) => !item.matched).length,
    borrowableUnits: items.reduce((sum, item) => sum + item.borrowable, 0),
  };
}

/** How the provider choice is presented to the user (real AI vs demo). */
export const PROVIDER_META: Record<KitProvider, { label: string; isRealAi: boolean }> = {
  llm: { label: "Real AI (LLM)", isRealAi: true },
  "rule-based": { label: "Rule-based demo", isRealAi: false },
};

function fuzzyScore(nameA: string, nameB: string): number {
  const a = normalizeText(nameA);
  const b = normalizeText(nameB);
  if (!a || !b) return 0;
  if (a === b) return 10;
  if (a.includes(b) || b.includes(a)) return 6;

  const tokensA = new Set(a.split(" "));
  const tokensB = b.split(" ");
  let score = 0;
  for (const token of tokensB) {
    if (token.length > 1 && tokensA.has(token)) score += 3;
  }
  // substring token matching (e.g. "dht22" in "dht22 temperature")
  const wordsA = a.split(" ");
  for (const tb of tokensB) {
    if (tb.length > 2 && wordsA.some((ta) => ta.includes(tb) || tb.includes(ta))) score += 2;
  }
  return score;
}

export async function buildKit(idea: string, maxItems = 12): Promise<KitResult> {
  const providerSetting = await getAiProvider();
  const configuredLlm = providerSetting === "llm" && hasLlmApiKey();

  let suggestions: AiSuggestion[];
  let provider: KitProvider;

  if (configuredLlm) {
    try {
      suggestions = await resolveWithLlm(idea, maxItems);
      provider = "llm";
    } catch (error) {
      // Real AI failed (network/quota/parse). Transparently fall back to the demo engine.
      console.error("[ai] LLM provider failed, falling back to rule-based:", error);
      suggestions = resolveRuleBased(idea, maxItems);
      provider = "rule-based";
    }
  } else {
    suggestions = resolveRuleBased(idea, maxItems);
    provider = "rule-based";
  }

  const catalog = (await listEquipment({ includeInactive: false })) as unknown as CatalogEquipment[];

  const items = suggestions.map((suggestion) => matchSuggestion(suggestion, catalog));

  return {
    provider,
    providerLabel: PROVIDER_META[provider].label,
    items,
    summary: summarize(items),
  };
}

export function matchSuggestion(suggestion: AiSuggestion, catalog: CatalogEquipment[]): KitResultItem {
  let best: CatalogEquipment | null = null;
  let bestScore = 0;

  for (const eq of catalog) {
    const score = fuzzyScore(suggestion.name, eq.name);
    if (score > bestScore) {
      bestScore = score;
      best = eq;
    }
  }

  const matched = bestScore > 0 && !!best;
  if (!best) {
    return { suggestion, equipment: null, matched, available: false, borrowable: 0, alternatives: [] };
  }

  const borrowable = best.availableQty > 0 ? Math.min(best.availableQty, suggestion.quantity) : 0;
  const available = borrowable > 0;

  const alternatives = available
    ? []
    : catalog
        .filter((eq) => eq.categoryId === best?.categoryId && eq.isActive && eq.availableQty > 0 && eq.id !== best?.id)
        .slice(0, 3);

  return { suggestion, equipment: best, matched, available, borrowable, alternatives };
}

export type { AiSuggestion };
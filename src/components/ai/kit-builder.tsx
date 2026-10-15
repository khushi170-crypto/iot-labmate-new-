"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Package,
  Repeat,
  Sparkles,
  Wand2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AvailabilityBadge } from "@/components/ui/status-badge";
import { apiFetch, ApiClientError } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import {
  COMPONENT_ROLE_LABEL,
  COMPONENT_ROLE_ORDER,
  type ComponentRole,
} from "@/lib/ai/rule-based";
import type { EquipmentView } from "@/lib/types";

interface Suggestion {
  name: string;
  quantity: number;
  reason: string;
  role: ComponentRole;
}

interface KitItem {
  suggestion: Suggestion;
  equipment: EquipmentView | null;
  matched: boolean;
  available: boolean;
  borrowable: number;
  alternatives: EquipmentView[];
}

interface KitSummary {
  total: number;
  available: number;
  outOfStock: number;
  notInCatalog: number;
  borrowableUnits: number;
}

interface KitResult {
  provider: "llm" | "rule-based";
  providerLabel: string;
  items: KitItem[];
  summary: KitSummary;
}

interface Row {
  key: number;
  suggestion: Suggestion;
  chosen: EquipmentView | null;
  alternatives: EquipmentView[];
  original: EquipmentView | null;
  matched: boolean;
  available: boolean;
  checked: boolean;
  qty: number;
}

const EXAMPLES = [
  "Smart plant watering system",
  "Home security alarm with motion detection",
  "Wi-Fi weather station reporting to the cloud",
  "Obstacle-avoiding robot car",
];

export function KitBuilder() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [maxItems, setMaxItems] = useState(12);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<KitResult | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    setResult(null);
    setRows([]);
    try {
      const data = await apiFetch<KitResult>("/api/ai/kit", {
        method: "POST",
        body: JSON.stringify({ idea, maxItems }),
      });
      const mapped: Row[] = data.items.map((item, index) => ({
        key: index,
        suggestion: item.suggestion,
        chosen: item.available && item.equipment ? item.equipment : item.equipment,
        alternatives: item.alternatives,
        original: item.equipment,
        matched: item.matched,
        available: item.available,
        checked: item.matched && item.available,
        qty: item.borrowable > 0 ? Math.min(item.borrowable, item.suggestion.quantity) : 1,
      }));
      setResult(data);
      setRows(mapped);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not generate a kit");
    } finally {
      setLoading(false);
    }
  }

  function toggle(key: number) {
    setRows((prev) =>
      prev.map((r) => (r.key === key && r.chosen ? { ...r, checked: !r.checked } : r))
    );
  }

  function pick(key: number, alt: EquipmentView) {
    setRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, chosen: alt, available: alt.availableQty > 0, qty: Math.min(r.qty, Math.max(1, alt.availableQty)), checked: true }
          : r
      )
    );
  }

  function setQty(key: number, qty: number) {
    setRows((prev) =>
      prev.map((r) =>
        r.key === key && r.chosen ? { ...r, qty: Math.max(1, Math.min(qty, r.chosen.availableQty)) } : r
      )
    );
  }

  const selected = rows.filter((r) => r.checked && r.chosen);

  const groups = COMPONENT_ROLE_ORDER.map((role) => ({
    role,
    items: rows.filter((r) => r.suggestion.role === role),
  })).filter((group) => group.items.length > 0);

  async function requestSelected() {
    setError(null);
    setSuccess(null);
    if (selected.length === 0) {
      setError("Select at least one available item.");
      return;
    }
    setSubmitting(true);
    try {
      await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify({
          notes: `AI kit: ${idea}`,
          items: selected.map((r) => ({ equipmentId: r.chosen!.id, quantity: r.qty })),
        }),
      });
      setSuccess("Booking request submitted from your AI kit!");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not submit request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-5">
          <label className="mb-2 block text-sm font-medium text-muted">
            Describe your project idea
          </label>
          <Textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="e.g. A Wi-Fi weather station that logs temperature, humidity and rainfall to the cloud…"
            className="min-h-28"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setIdea(ex)}
                className="rounded-full border border-line px-3 py-1 text-xs text-muted transition hover:border-neon/40 hover:text-foreground"
              >
                {ex}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted">
              <span>Max items</span>
              {[6, 12, 18].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMaxItems(n)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium transition",
                    maxItems === n
                      ? "border-neon/50 bg-neon/10 text-neon"
                      : "border-line text-muted hover:text-foreground"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <Button onClick={generate} loading={loading} disabled={idea.trim().length < 5}>
              {!loading && <Wand2 className="size-4" />} Generate kit
            </Button>
          </div>
          {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        </CardContent>
      </Card>

      {result ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-neon" />
              <span className="font-semibold text-foreground">Suggested kit</span>
              <Badge
                className={
                  result.provider === "llm"
                    ? "border-success/30 bg-success/10 text-success"
                    : "border-violet-400/30 bg-violet-400/10 text-violet-400"
                }
              >
                {result.provider === "llm" ? "Real AI (LLM)" : "Rule-based demo"}
              </Badge>
            </div>
            <Button onClick={requestSelected} loading={submitting} disabled={selected.length === 0}>
              Request {selected.length > 0 ? `${selected.length} ` : ""}selected
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge className="border-line text-muted">
              {result.summary.total} components
            </Badge>
            <Badge className="border-success/30 bg-success/10 text-success">
              {result.summary.available} in stock
            </Badge>
            {result.summary.outOfStock > 0 ? (
              <Badge className="border-warning/30 bg-warning/10 text-warning">
                {result.summary.outOfStock} out of stock
              </Badge>
            ) : null}
            {result.summary.notInCatalog > 0 ? (
              <Badge className="border-danger/30 bg-danger/10 text-danger">
                {result.summary.notInCatalog} not in catalog
              </Badge>
            ) : null}
          </div>

          {result.summary.notInCatalog > 0 ? (
            <p className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs text-danger">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
              {result.summary.notInCatalog} component{result.summary.notInCatalog > 1 ? "s" : ""} from this kit
              {result.summary.notInCatalog > 1 ? " are" : " is"} not stocked by the lab. You can still request the
              rest, or ask the lab assistant to source {result.summary.notInCatalog > 1 ? "them" : "it"}.
            </p>
          ) : null}

          {success ? (
            <p className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="size-4" /> {success}{" "}
              <Link href="/student/bookings" className="underline">
                View bookings
              </Link>
            </p>
          ) : null}

          <div className="space-y-5">
            {groups.map((group) => (
              <div key={group.role} className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {COMPONENT_ROLE_LABEL[group.role]} · {group.items.length}
                </h3>
                {group.items.map((row) => (
                  <div key={row.key} className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => toggle(row.key)}
                  disabled={!row.chosen}
                  aria-label="Toggle item"
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded border transition",
                    row.checked
                      ? "border-neon bg-neon text-navy"
                      : "border-line text-transparent hover:border-neon/50",
                    !row.chosen && "cursor-not-allowed opacity-40"
                  )}
                >
                  <CheckCircle2 className="size-3.5" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">{row.suggestion.name}</span>
                    {row.matched ? (
                      row.available ? (
                        <Badge className="border-success/30 bg-success/10 text-success">In catalog</Badge>
                      ) : (
                        <Badge className="border-warning/30 bg-warning/10 text-warning">Out of stock</Badge>
                      )
                    ) : (
                      <Badge className="border-danger/30 bg-danger/10 text-danger">Not in catalog</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{row.suggestion.reason}</p>

                  {row.chosen ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                      <span className="flex items-center gap-1 text-muted">
                        <Package className="size-3" /> {row.chosen.name}
                      </span>
                      <AvailabilityBadge availableQty={row.chosen.availableQty} totalQty={row.chosen.totalQty} />
                    </div>
                  ) : (
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-danger">
                      <XCircle className="size-3" /> No matching equipment in the lab catalog
                    </p>
                  )}

                  {!row.available && row.alternatives.length > 0 ? (
                    <div className="mt-2">
                      <p className="flex items-center gap-1 text-xs text-warning">
                        <AlertTriangle className="size-3" /> Alternatives in stock:
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {row.alternatives.map((alt) => (
                          <button
                            key={alt.id}
                            type="button"
                            onClick={() => pick(row.key, alt)}
                            className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-muted transition hover:border-neon/40 hover:text-foreground"
                          >
                            <Repeat className="size-3" /> {alt.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {row.checked && row.chosen ? (
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-xs text-muted">Qty</span>
                    <input
                      type="number"
                      min={1}
                      max={row.chosen.availableQty}
                      value={row.qty}
                      onChange={(e) => setQty(row.key, Number(e.target.value))}
                      className="w-16 rounded-lg border border-line bg-surface px-2 py-1 text-sm text-foreground focus:border-neon/60 focus:outline-none"
                    />
                  </div>
                ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
import { db } from "@/lib/db";
import { DEFAULT_SETTINGS, SETTING_KEYS } from "@/lib/constants";
import { envNumber, envString } from "@/lib/env";

const ENV_FALLBACKS: Record<string, () => string> = {
  [SETTING_KEYS.FINE_RATE_PER_DAY]: () => String(envNumber("FINE_RATE_PER_DAY", 10)),
  [SETTING_KEYS.LOAN_PERIOD_DAYS]: () => String(envNumber("LOAN_PERIOD_DAYS", 7)),
  [SETTING_KEYS.CURRENCY]: () => envString("CURRENCY", "$"),
  [SETTING_KEYS.AI_PROVIDER]: () => envString("AI_PROVIDER", "rule-based"),
};

export async function getSetting(key: string): Promise<string> {
  const row = await db.appSetting.findUnique({ where: { key } });
  if (row) return row.value;
  return ENV_FALLBACKS[key]?.() ?? DEFAULT_SETTINGS[key] ?? "";
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.appSetting.findMany();
  const stored = new Map(rows.map((r) => [r.key, r.value]));
  const out: Record<string, string> = {};
  for (const key of Object.keys(SETTING_KEYS)) {
    out[key] = stored.get(key) ?? ENV_FALLBACKS[key]?.() ?? DEFAULT_SETTINGS[key] ?? "";
  }
  return out;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.appSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

export async function getFineRatePerDay(): Promise<number> {
  return Number(await getSetting(SETTING_KEYS.FINE_RATE_PER_DAY));
}

export async function getLoanPeriodDays(): Promise<number> {
  return Number(await getSetting(SETTING_KEYS.LOAN_PERIOD_DAYS));
}

export async function getCurrency(): Promise<string> {
  return await getSetting(SETTING_KEYS.CURRENCY);
}

export async function getAiProvider(): Promise<string> {
  return await getSetting(SETTING_KEYS.AI_PROVIDER);
}

export function hasLlmApiKey(): boolean {
  return Boolean(process.env.LLM_API_KEY?.trim());
}

export function getAssistantSignupCode(): string {
  return envString("ASSISTANT_SIGNUP_CODE", "");
}
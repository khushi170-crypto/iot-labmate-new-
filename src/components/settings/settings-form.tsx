"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Bot, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch, ApiClientError } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

export function SettingsForm({
  initial,
  llmConfigured,
}: {
  initial: { fineRatePerDay: string; loanPeriodDays: string; currency: string; aiProvider: string };
  llmConfigured: boolean;
}) {
  const router = useRouter();
  const [fineRatePerDay, setFineRatePerDay] = useState(initial.fineRatePerDay);
  const [loanPeriodDays, setLoanPeriodDays] = useState(initial.loanPeriodDays);
  const [currency, setCurrency] = useState(initial.currency);
  const [aiProvider, setAiProvider] = useState(initial.aiProvider);
  const [status, setStatus] = useState<{ ok?: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    setSaving(true);
    try {
      await apiFetch("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          fineRatePerDay: Number(fineRatePerDay),
          loanPeriodDays: Number(loanPeriodDays),
          currency,
          aiProvider,
        }),
      });
      setStatus({ ok: true, message: "Settings saved." });
      router.refresh();
    } catch (err) {
      setStatus({ message: err instanceof ApiClientError ? err.message : "Could not save settings" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <section className="panel space-y-4 p-6">
        <h2 className="font-semibold text-foreground">Loan &amp; fines</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Loan period (days)" hint="Default due date after issue">
            <Input
              type="number"
              min={1}
              value={loanPeriodDays}
              onChange={(e) => setLoanPeriodDays(e.target.value)}
            />
          </Field>
          <Field label="Fine rate / day">
            <Input
              type="number"
              min={0}
              step="0.5"
              value={fineRatePerDay}
              onChange={(e) => setFineRatePerDay(e.target.value)}
            />
          </Field>
          <Field label="Currency symbol">
            <Input value={currency} maxLength={5} onChange={(e) => setCurrency(e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="space-y-4 panel p-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Bot className="size-4 text-neon" /> AI provider
          </h2>
          <Badge
            className={
              llmConfigured
                ? "border-success/30 bg-success/10 text-success"
                : "border-warning/30 bg-warning/10 text-warning"
            }
          >
            {llmConfigured ? "LLM key configured" : "No LLM key set"}
          </Badge>
        </div>
        <Field label="Engine used by the kit builder">
          <Select value={aiProvider} onChange={(e) => setAiProvider(e.target.value)}>
            <option value="rule-based">Rule-based (offline, always available)</option>
            <option value="llm" disabled={!llmConfigured}>
              Real LLM {llmConfigured ? "" : "(set LLM_API_KEY first)"}
            </option>
          </Select>
        </Field>
        <p className={cn("text-xs text-muted")}>
          <Sparkles className="mr-1 inline size-3" />
          Rule-based works offline with zero cost. Choosing the LLM uses your configured
          OpenAI-compatible endpoint; if a request fails, LabMate falls back to rule-based automatically.
        </p>
      </section>

      {status ? (
        <p className={status.ok ? "text-sm text-success" : "text-sm text-danger"}>{status.message}</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          <Save className="size-4" /> Save settings
        </Button>
      </div>
    </form>
  );
}
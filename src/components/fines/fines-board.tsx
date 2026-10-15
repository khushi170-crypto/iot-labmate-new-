"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HandCoins, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FineStatusBadge } from "@/components/ui/status-badge";
import { PaymentDetails } from "@/components/fines/payment-details";
import { apiFetch, ApiClientError } from "@/lib/fetcher";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { FineStatus } from "@/generated/prisma/client";
import type { FineView, PaymentView } from "@/lib/types";

interface FineRow extends FineView {
  booking: { code: string; items: Array<{ equipment: { name: string } }> };
  student: { id: string; name: string; email: string };
  payments: PaymentView[];
}

export function FinesBoard({ fines, currency }: { fines: FineRow[]; currency: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const totals = fines.reduce(
    (acc, f) => {
      if (f.status === "UNPAID") acc.unpaid += f.amount;
      if (f.status === "PAID") acc.collected += f.amount;
      if (f.status === "WAIVED") acc.waived += f.amount;
      return acc;
    },
    { unpaid: 0, collected: 0, waived: 0 }
  );

  async function setStatus(id: string, status: FineStatus) {
    setError(null);
    setBusyId(id);
    try {
      await apiFetch(`/api/fines/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Summary label="Outstanding" value={formatCurrency(totals.unpaid, currency)} tone="text-danger" />
        <Summary label="Collected" value={formatCurrency(totals.collected, currency)} tone="text-success" />
        <Summary label="Waived" value={formatCurrency(totals.waived, currency)} tone="text-muted" />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {fines.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 px-6 py-16 text-center">
          <HandCoins className="size-8 text-muted" />
          <p className="font-medium text-foreground">No fines recorded</p>
          <p className="text-sm text-muted">Late returns will generate fines here automatically.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fines.map((fine) => {
            const paidPayment = fine.payments?.find((p) => p.status === "PAID") ?? null;
            return (
              <div key={fine.id} className="panel p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-neon">{fine.booking.code}</span>
                      <FineStatusBadge status={fine.status} />
                    </div>
                    <p className="mt-1 text-sm text-foreground">
                      {fine.student.name} <span className="text-muted">· {fine.student.email}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {fine.daysLate} day(s) late · {formatCurrency(fine.rateApplied, currency)}/day · issued{" "}
                      {formatDate(fine.createdAt)}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {fine.booking.items.map((i) => i.equipment.name).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <span className="text-lg font-bold text-foreground">{formatCurrency(fine.amount, currency)}</span>
                    {fine.status === "UNPAID" ? (
                      <div className="flex gap-2">
                        <Button size="sm" loading={busyId === fine.id} onClick={() => setStatus(fine.id, "PAID")}>
                          <HandCoins className="size-3.5" /> Collect
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          loading={busyId === fine.id}
                          onClick={() => setStatus(fine.id, "WAIVED")}
                        >
                          <ShieldCheck className="size-3.5" /> Waive
                        </Button>
                      </div>
                    ) : paidPayment ? (
                      <span className="text-xs font-medium text-success">Paid online</span>
                    ) : null}
                  </div>
                </div>
                {paidPayment ? <PaymentDetails payment={paidPayment} /> : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Summary({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="panel p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
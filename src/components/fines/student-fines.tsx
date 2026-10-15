import { HandCoins } from "lucide-react";
import { FinePayButton } from "@/components/fines/fine-pay-button";
import { FineStatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { FineView, PaymentView } from "@/lib/types";

interface FineRow extends FineView {
  booking: { code: string; items: Array<{ equipment: { name: string } }> };
  payments: PaymentView[];
}

export function StudentFines({
  fines,
  currency,
  paymentsEnabled,
}: {
  fines: FineRow[];
  currency: string;
  paymentsEnabled: boolean;
}) {
  const totals = fines.reduce(
    (acc, f) => {
      if (f.status === "UNPAID") acc.unpaid += f.amount;
      if (f.status === "PAID") acc.paid += f.amount;
      if (f.status === "WAIVED") acc.waived += f.amount;
      return acc;
    },
    { unpaid: 0, paid: 0, waived: 0 }
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Summary label="Outstanding" value={formatCurrency(totals.unpaid, currency)} tone="text-danger" />
        <Summary label="Paid" value={formatCurrency(totals.paid, currency)} tone="text-success" />
        <Summary label="Waived" value={formatCurrency(totals.waived, currency)} tone="text-muted" />
      </div>

      {fines.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 px-6 py-16 text-center">
          <HandCoins className="size-8 text-muted" />
          <p className="font-medium text-foreground">No fines on your account</p>
          <p className="text-sm text-muted">Return equipment on time and this page stays empty.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fines.map((fine) => (
            <div key={fine.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-neon">{fine.booking.code}</span>
                    <FineStatusBadge status={fine.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {fine.daysLate} day(s) late · {formatCurrency(fine.rateApplied, currency)}/day · issued{" "}
                    {formatDate(fine.createdAt)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {fine.booking.items.map((i) => i.equipment.name).join(", ")}
                  </p>
                </div>
                <span className="text-lg font-bold text-foreground">{formatCurrency(fine.amount, currency)}</span>
              </div>
              <FinePayButton
                fineId={fine.id}
                bookingCode={fine.booking.code}
                status={fine.status}
                payments={fine.payments}
                paymentsEnabled={paymentsEnabled}
              />
            </div>
          ))}
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

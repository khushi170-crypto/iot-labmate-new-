import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import type { PaymentView } from "@/lib/types";

export function PaymentDetails({ payment, className }: { payment: PaymentView; className?: string }) {
  return (
    <dl
      className={cn(
        "mt-2 grid gap-x-4 gap-y-1 rounded-lg border border-success/25 bg-success/5 px-3 py-2 text-xs sm:grid-cols-2",
        className
      )}
    >
      <Row label="Transaction id" value={payment.paymentId ?? "—"} mono />
      <Row label="Order id" value={payment.orderId} mono />
      <Row label="Amount paid" value={formatCurrency(payment.amount, payment.currency)} />
      <Row label="Method" value={payment.method ? payment.method.toUpperCase() : "—"} />
      <Row label="Gateway status" value={payment.gatewayStatus ?? payment.status} />
      <Row label="Paid on" value={formatDateTime(payment.verifiedAt ?? payment.createdAt)} />
    </dl>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("truncate font-medium text-foreground", mono && "font-mono")} title={value}>
        {value}
      </dd>
    </div>
  );
}

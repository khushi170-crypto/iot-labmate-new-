import { CalendarClock, Package } from "lucide-react";
import type { ReactNode } from "react";
import { BookingStatusBadge, FineStatusBadge } from "@/components/ui/status-badge";
import { FinePayButton } from "@/components/fines/fine-pay-button";
import { PaymentDetails } from "@/components/fines/payment-details";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { BookingView } from "@/lib/types";

export function BookingCard({
  booking,
  currency = "$",
  showStudent = false,
  canPay = false,
  paymentsEnabled = false,
  actions,
}: {
  booking: BookingView;
  currency?: string;
  showStudent?: boolean;
  canPay?: boolean;
  paymentsEnabled?: boolean;
  actions?: ReactNode;
}) {
  const overdue = booking.status === "OVERDUE";
  const fine = booking.fine;
  const paidPayment = fine?.payments?.find((p) => p.status === "PAID") ?? null;

  return (
    <div className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-neon">{booking.code}</span>
            <BookingStatusBadge status={booking.status} />
          </div>
          {showStudent && booking.student ? (
            <p className="mt-1 text-sm text-foreground">
              {booking.student.name} <span className="text-muted">· {booking.student.email}</span>
            </p>
          ) : null}
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <CalendarClock className="size-3.5" />
            Requested {formatDateTime(booking.createdAt)}
            {booking.dueAt ? (
              <span className={overdue ? "font-semibold text-danger" : ""}>
                · Due {formatDateTime(booking.dueAt)}
              </span>
            ) : null}
          </p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>

      <div className="mt-4 space-y-1.5">
        {booking.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-foreground">
              <Package className="size-3.5 text-muted" />
              {item.equipment.name}
            </span>
            <span className="text-muted">× {item.quantity}</span>
          </div>
        ))}
      </div>

      {booking.notes ? <p className="mt-3 text-xs italic text-muted">“{booking.notes}”</p> : null}

      {booking.fine ? (
        <div className="mt-4 rounded-lg border border-warning/25 bg-warning/5 px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-warning">
              Fine · {booking.fine.daysLate} day(s) late · {formatCurrency(booking.fine.amount, currency)}
            </span>
            <FineStatusBadge status={booking.fine.status} />
          </div>
          {canPay ? (
            <FinePayButton
              fineId={booking.fine.id}
              bookingCode={booking.code}
              status={booking.fine.status}
              payments={booking.fine.payments}
              paymentsEnabled={paymentsEnabled}
            />
          ) : booking.fine.status === "PAID" && paidPayment ? (
            <PaymentDetails payment={paidPayment} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
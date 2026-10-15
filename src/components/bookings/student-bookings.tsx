"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban } from "lucide-react";
import { BookingCard } from "@/components/bookings/booking-card";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiClientError } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { BOOKING_STATUS_META } from "@/lib/constants";
import type { BookingStatus } from "@/generated/prisma/client";
import type { BookingView } from "@/lib/types";

const FILTERS: Array<{ value: BookingStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: BOOKING_STATUS_META.PENDING.label },
  { value: "APPROVED", label: BOOKING_STATUS_META.APPROVED.label },
  { value: "ISSUED", label: BOOKING_STATUS_META.ISSUED.label },
  { value: "OVERDUE", label: BOOKING_STATUS_META.OVERDUE.label },
  { value: "RETURNED", label: BOOKING_STATUS_META.RETURNED.label },
];

export function StudentBookings({
  bookings,
  currency,
  paymentsEnabled = false,
}: {
  bookings: BookingView[];
  currency: string;
  paymentsEnabled?: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<BookingStatus | "ALL">("ALL");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(
    () => (filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter)),
    [bookings, filter]
  );

  async function cancel(id: string) {
    setError(null);
    setBusyId(id);
    try {
      await apiFetch(`/api/bookings/${id}`, {
        method: "POST",
        body: JSON.stringify({ action: "cancel" }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not cancel booking");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              filter === f.value
                ? "border-neon/50 bg-neon/10 text-neon"
                : "border-line text-muted hover:border-neon/30 hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {filtered.length === 0 ? (
        <div className="panel px-6 py-14 text-center text-sm text-muted">No bookings in this view.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              currency={currency}
              canPay
              paymentsEnabled={paymentsEnabled}
              actions={
                booking.status === "PENDING" ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={busyId === booking.id}
                    onClick={() => cancel(booking.id)}
                  >
                    <Ban className="size-4" /> Cancel
                  </Button>
                ) : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
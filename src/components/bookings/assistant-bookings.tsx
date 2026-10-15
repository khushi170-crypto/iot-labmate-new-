"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, PackageCheck, RotateCcw, X } from "lucide-react";
import { BookingCard } from "@/components/bookings/booking-card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { EQUIPMENT_CONDITIONS } from "@/lib/constants";
import { apiFetch, ApiClientError } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import type { BookingStatus, EquipmentCondition } from "@/generated/prisma/client";
import type { BookingView } from "@/lib/types";

const FILTERS: Array<{ value: BookingStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "ISSUED", label: "Issued" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "RETURNED", label: "Returned" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function AssistantBookings({ bookings, currency }: { bookings: BookingView[]; currency: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<BookingStatus | "ALL">("PENDING");
  const [returningId, setReturningId] = useState<string | null>(null);
  const [itemConditions, setItemConditions] = useState<Record<string, EquipmentCondition>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (filter !== "ALL" && b.status !== filter) return false;
      if (!term) return true;
      return (
        b.code.toLowerCase().includes(term) ||
        (b.student?.name ?? "").toLowerCase().includes(term) ||
        (b.student?.email ?? "").toLowerCase().includes(term)
      );
    });
  }, [bookings, search, filter]);

  async function run(id: string, action: string, body?: Record<string, unknown>) {
    setError(null);
    setBusyId(id);
    try {
      await apiFetch(`/api/bookings/${id}`, {
        method: "POST",
        body: JSON.stringify({ action, ...(body ?? {}) }),
      });
      setReturningId(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  function openReturn(b: BookingView) {
    setReturningId((prev) => (prev === b.id ? null : b.id));
    setItemConditions(
      Object.fromEntries(b.items.map((i) => [i.equipmentId, i.conditionOnIssue ?? "GOOD"]))
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by code or student…"
          className="md:w-72"
        />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {filtered.length === 0 ? (
        <div className="panel px-6 py-14 text-center text-sm text-muted">No bookings match this view.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) => (
            <div key={booking.id} className="space-y-2">
              <BookingCard
                booking={booking}
                currency={currency}
                showStudent
                actions={
                  <>
                    {booking.status === "PENDING" ? (
                      <>
                        <Button
                          size="sm"
                          loading={busyId === booking.id}
                          onClick={() => run(booking.id, "approve")}
                        >
                          <Check className="size-4" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          loading={busyId === booking.id}
                          onClick={() => run(booking.id, "reject")}
                        >
                          <X className="size-4" /> Reject
                        </Button>
                      </>
                    ) : null}
                    {booking.status === "APPROVED" ? (
                      <Button
                        size="sm"
                        variant="success"
                        loading={busyId === booking.id}
                        onClick={() => run(booking.id, "issue")}
                      >
                        <PackageCheck className="size-4" /> Issue
                      </Button>
                    ) : null}
                    {booking.status === "ISSUED" || booking.status === "OVERDUE" ? (
                      <Button size="sm" variant="secondary" onClick={() => openReturn(booking)}>
                        {returningId === booking.id ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <RotateCcw className="size-4" />
                        )}
                        Return
                      </Button>
                    ) : null}
                  </>
                }
              />

              {returningId === booking.id ? (
                <div className="panel space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Eye className="size-4 text-neon" /> Record returned condition
                    </p>
                    <Button variant="ghost" size="sm" onClick={() => setReturningId(null)}>
                      Close
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {booking.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 flex-1 truncate text-foreground">{item.equipment.name}</span>
                        <Select
                          value={itemConditions[item.equipmentId] ?? "GOOD"}
                          onChange={(e) =>
                            setItemConditions((prev) => ({
                              ...prev,
                              [item.equipmentId]: e.target.value as EquipmentCondition,
                            }))
                          }
                          className="w-32 py-1.5 text-xs"
                        >
                          {EQUIPMENT_CONDITIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </Select>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      loading={busyId === booking.id}
                      onClick={() =>
                        run(booking.id, "return", {
                          items: booking.items.map((i) => ({
                            equipmentId: i.equipmentId,
                            condition: itemConditions[i.equipmentId],
                          })),
                        })
                      }
                    >
                      Confirm return
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
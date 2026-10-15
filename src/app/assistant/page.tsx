import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck,
  ClipboardList,
  HandCoins,
  MessageSquareWarning,
  PackageX,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { BookingCard } from "@/components/bookings/booking-card";
import { OverdueSyncButton } from "@/components/bookings/overdue-sync-button";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/session";
import { listBookings } from "@/lib/booking.service";
import { listFines } from "@/lib/fines.service";
import { listComplaints } from "@/lib/complaint.service";
import { listEquipment } from "@/lib/equipment.service";
import { getCurrency } from "@/lib/settings.service";
import type { BookingView } from "@/lib/types";

export const metadata = { title: "Assistant Dashboard" };

export default async function AssistantDashboardPage() {
  await requireUser();
  const [bookings, fines, complaints, equipment, currency] = await Promise.all([
    listBookings(),
    listFines(),
    listComplaints(),
    listEquipment({ includeInactive: false }),
    getCurrency(),
  ]);

  const pending = bookings.filter((b) => b.status === "PENDING");
  const active = bookings.filter((b) => b.status === "ISSUED" || b.status === "OVERDUE");
  const overdue = bookings.filter((b) => b.status === "OVERDUE");
  const unpaid = fines.filter((f) => f.status === "UNPAID").reduce((s, f) => s + f.amount, 0);
  const openComplaints = complaints.filter((c) => c.status === "OPEN" || c.status === "IN_REVIEW");
  const lowStock = equipment.filter((e) => e.availableQty * 4 <= e.totalQty);

  const queue = (pending as unknown as BookingView[]).slice(0, 4);

  return (
    <div>
      <PageHeader
        title="Lab overview"
        description="Everything you need to run the IoT lab today."
        action={<OverdueSyncButton />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Pending approvals" value={pending.length} icon={ClipboardList} tone="warning" />
        <StatCard label="Active loans" value={active.length} icon={CalendarCheck} tone="neon" />
        <StatCard label="Overdue" value={overdue.length} icon={AlertTriangle} tone="danger" />
        <StatCard label="Unpaid fines" value={`${currency}${unpaid.toFixed(2)}`} icon={HandCoins} tone="danger" />
        <StatCard label="Open complaints" value={openComplaints.length} icon={MessageSquareWarning} tone="violet" />
        <StatCard label="Low stock items" value={lowStock.length} icon={PackageX} tone="warning" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Approval queue</h2>
            <Link href="/assistant/bookings">
              <Button variant="ghost" size="sm">Open bookings</Button>
            </Link>
          </div>
          {queue.length === 0 ? (
            <div className="panel px-6 py-12 text-center text-sm text-muted">
              No pending requests. Nice and tidy.
            </div>
          ) : (
            <div className="space-y-4">
              {queue.map((booking) => (
                <BookingCard key={booking.id} booking={booking} currency={currency} showStudent />
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Low stock watch</h2>
            <Link href="/assistant/inventory">
              <Button variant="ghost" size="sm">Manage inventory</Button>
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <div className="panel px-6 py-12 text-center text-sm text-muted">
              All components are well stocked.
            </div>
          ) : (
            <div className="panel divide-y divide-line">
              {lowStock.slice(0, 6).map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="min-w-0 flex-1 truncate text-foreground">{e.name}</span>
                  <span className="text-muted">
                    {e.availableQty} / {e.totalQty}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarCheck, HandCoins, MessageSquareWarning, PackageSearch, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { BookingCard } from "@/components/bookings/booking-card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/session";
import { listStudentBookings } from "@/lib/booking.service";
import { listFines } from "@/lib/fines.service";
import { onlinePaymentsEnabled } from "@/lib/payments.service";
import { listStudentComplaints } from "@/lib/complaint.service";
import { getCurrency } from "@/lib/settings.service";
import type { BookingView } from "@/lib/types";

export const metadata = { title: "Student Dashboard" };

export default async function StudentDashboardPage() {
  const user = await requireUser();
  const [bookings, fines, complaints, currency] = await Promise.all([
    listStudentBookings(user.id),
    listFines({ studentId: user.id }),
    listStudentComplaints(user.id),
    getCurrency(),
  ]);

  const paymentsEnabled = onlinePaymentsEnabled();
  const active = bookings.filter((b) => b.status === "ISSUED" || b.status === "OVERDUE");
  const pending = bookings.filter((b) => b.status === "PENDING");
  const unpaidFines = fines.filter((f) => f.status === "UNPAID");
  const unpaid = unpaidFines.reduce((sum, f) => sum + f.amount, 0);
  const openComplaints = complaints.filter((c) => c.status === "OPEN" || c.status === "IN_REVIEW");
  const recent = (bookings as unknown as BookingView[]).slice(0, 3);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Here's what's happening with your lab loans."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active loans" value={active.length} icon={CalendarCheck} tone="neon" />
        <StatCard label="Pending requests" value={pending.length} icon={PackageSearch} tone="warning" />
        {unpaid > 0 ? (
          <Link href="/student/fines" className="block transition hover:opacity-90">
            <StatCard
              label="Unpaid fines"
              value={`${currency}${unpaid.toFixed(2)}`}
              icon={HandCoins}
              tone="danger"
              hint={`${unpaidFines.length} fine(s) · tap to pay online`}
            />
          </Link>
        ) : (
          <StatCard label="Unpaid fines" value={`${currency}${unpaid.toFixed(2)}`} icon={HandCoins} tone="danger" />
        )}
        <StatCard label="Open complaints" value={openComplaints.length} icon={MessageSquareWarning} tone="violet" />
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link href="/student/catalog" className="panel group flex items-center gap-4 p-6 transition hover:border-neon/30">
          <span className="flex size-12 items-center justify-center rounded-xl bg-neon/10 text-neon">
            <PackageSearch className="size-6" />
          </span>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-neon">Browse equipment</h3>
            <p className="text-sm text-muted">Find and request components from the lab inventory.</p>
          </div>
        </Link>
        <Link href="/student/kit-builder" className="panel group flex items-center gap-4 p-6 transition hover:border-neon/30">
          <span className="flex size-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
            <Sparkles className="size-6" />
          </span>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-neon">Build a kit with AI</h3>
            <p className="text-sm text-muted">Describe your project idea and get a parts list instantly.</p>
          </div>
        </Link>
      </div>

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Recent bookings</h2>
          <Link href="/student/bookings">
            <Button variant="ghost" size="sm">View all</Button>
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="size-6" />}
            title="No bookings yet"
            text="Browse the catalog to request your first set of components."
          />
        ) : (
          <div className="space-y-4">
            {recent.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                currency={currency}
                canPay
                paymentsEnabled={paymentsEnabled}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="panel flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="mb-1 flex size-12 items-center justify-center rounded-xl bg-surface-2 text-muted">{icon}</span>
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted">{text}</p>
    </div>
  );
}
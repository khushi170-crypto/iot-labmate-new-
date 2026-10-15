import { PageHeader } from "@/components/ui/page-header";
import { AssistantBookings } from "@/components/bookings/assistant-bookings";
import { requireUser } from "@/lib/session";
import { listBookings } from "@/lib/booking.service";
import { getCurrency } from "@/lib/settings.service";
import type { BookingView } from "@/lib/types";

export const metadata = { title: "Bookings" };

export default async function AssistantBookingsPage() {
  await requireUser();
  const [bookings, currency] = await Promise.all([listBookings(), getCurrency()]);

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Approve requests, issue equipment and record returns."
      />
      <AssistantBookings bookings={bookings as unknown as BookingView[]} currency={currency} />
    </div>
  );
}
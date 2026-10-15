import { PageHeader } from "@/components/ui/page-header";
import { StudentBookings } from "@/components/bookings/student-bookings";
import { requireUser } from "@/lib/session";
import { listStudentBookings } from "@/lib/booking.service";
import { getCurrency } from "@/lib/settings.service";
import type { BookingView } from "@/lib/types";

export const metadata = { title: "My Bookings" };

export default async function StudentBookingsPage() {
  const user = await requireUser();
  const [bookings, currency] = await Promise.all([listStudentBookings(user.id), getCurrency()]);

  return (
    <div>
      <PageHeader
        title="My bookings"
        description="Track the status of every equipment request and loan."
      />
      <StudentBookings bookings={bookings as unknown as BookingView[]} currency={currency} />
    </div>
  );
}
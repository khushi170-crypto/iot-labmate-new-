import { z } from "zod";
import { apiError, fail, json, requireApiUser } from "@/lib/api";
import { createBooking, listBookings, listStudentBookings } from "@/lib/booking.service";
import { createBookingSchema } from "@/lib/validators";
import { Role, type BookingStatus } from "@/generated/prisma/client";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    const url = new URL(request.url);

    if (user.role === Role.STUDENT) {
      return json(await listStudentBookings(user.id));
    }

    const status = (url.searchParams.get("status") as BookingStatus | null) ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;
    return json(await listBookings({ status, search }));
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireApiUser([Role.STUDENT]);
    const body = await request.json();
    const parsed = createBookingSchema.parse(body);
    const booking = await createBooking(user.id, parsed);
    return json(booking, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error.issues[0]?.message ?? "Invalid input", 422);
    return apiError(error);
  }
}
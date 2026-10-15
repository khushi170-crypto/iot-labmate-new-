import { apiError, json, requireApiUser } from "@/lib/api";
import { markOverdueBookings } from "@/lib/booking.service";
import { Role } from "@/generated/prisma/client";

export async function POST() {
  try {
    await requireApiUser([Role.LAB_ASSISTANT]);
    const count = await markOverdueBookings();
    return json({ markedOverdue: count });
  } catch (error) {
    return apiError(error);
  }
}
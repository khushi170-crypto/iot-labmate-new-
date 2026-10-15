import { z } from "zod";
import type { NextRequest } from "next/server";
import { apiError, fail, json, requireApiUser } from "@/lib/api";
import { approveBooking, getBooking, issueBooking, rejectBooking, returnBooking } from "@/lib/booking.service";
import { db } from "@/lib/db";
import { returnBookingSchema } from "@/lib/validators";
import { Role } from "@/generated/prisma/client";

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await ctx.params;
    const booking = await getBooking(id);
    if (!booking) throw new Error("Booking not found");
    if (user.role === Role.STUDENT && booking.studentId !== user.id) throw new Error("Booking not found");
    return json(booking);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireApiUser();
    const { id } = await ctx.params;
    const body = await request.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "";

    if (user.role === Role.STUDENT && action === "cancel") {
      const booking = await getBooking(id);
      if (!booking || booking.studentId !== user.id) throw new Error("Booking not found");
      if (booking.status !== "PENDING") throw new Error("Only pending bookings can be cancelled");
      const updated = await db.booking.update({ where: { id }, data: { status: "CANCELLED" } });
      return json(updated);
    }

    if (user.role !== Role.LAB_ASSISTANT) {
      return fail("You don't have permission to perform this action", 403);
    }

    switch (action) {
      case "approve": {
        const booking = await approveBooking(id, user.id);
        return json(booking);
      }
      case "reject": {
        const booking = await rejectBooking(id, user.id);
        return json(booking);
      }
      case "issue": {
        const booking = await issueBooking(id, user.id);
        return json(booking);
      }
      case "return": {
        const parsed = returnBookingSchema.parse(body ?? {});
        const result = await returnBooking(id, parsed);
        return json(result);
      }
      default:
        return fail("Unknown action", 400);
    }
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error.issues[0]?.message ?? "Invalid input", 422);
    return apiError(error);
  }
}
import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { assertStock, releaseStock, reserveStock } from "@/lib/inventory.service";
import { createFineForReturn } from "@/lib/fines.service";
import { getFineRatePerDay, getLoanPeriodDays } from "@/lib/settings.service";
import type { CreateBookingInput, ReturnBookingInput } from "@/lib/validators";
import type { BookingStatus, Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

function generateCode(): string {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  const stamp = Date.now().toString(36).slice(-3).toUpperCase();
  return `LM-${rand}${stamp}`;
}

async function uniqueCode(tx: Tx): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateCode();
    const existing = await tx.booking.findUnique({ where: { code } });
    if (!existing) return code;
  }
  throw new ApiError(500, "Could not generate a unique booking code");
}

export async function createBooking(studentId: string, input: CreateBookingInput) {
  await assertStock(input.items);
  return db.$transaction(async (tx) => {
    const code = await uniqueCode(tx);
    return tx.booking.create({
      data: {
        code,
        studentId,
        notes: input.notes || null,
        items: {
          create: input.items.map((i) => ({ equipmentId: i.equipmentId, quantity: i.quantity })),
        },
      },
      include: { items: { include: { equipment: { include: { category: true } } } } },
    });
  });
}

export async function listStudentBookings(studentId: string) {
  return db.booking.findMany({
    where: { studentId },
    include: {
      items: { include: { equipment: { include: { category: true } } } },
      fine: { include: { payments: { orderBy: { createdAt: "desc" } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function listBookings(opts: { status?: BookingStatus; search?: string } = {}) {
  const where: Prisma.BookingWhereInput = {};
  if (opts.status) where.status = opts.status;
  if (opts.search?.trim()) {
    where.OR = [
      { code: { contains: opts.search.trim() } },
      { student: { name: { contains: opts.search.trim() } } },
    ];
  }
  return db.booking.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, email: true } },
      items: { include: { equipment: { include: { category: true } } } },
      fine: { include: { payments: { orderBy: { createdAt: "desc" } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBooking(id: string) {
  return db.booking.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, name: true, email: true } },
      items: { include: { equipment: { include: { category: true } } } },
      fine: { include: { payments: { orderBy: { createdAt: "desc" } } } },
    },
  });
}

async function assertTransition(id: string, allowed: BookingStatus[], label: string) {
  const booking = await db.booking.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!booking) throw new ApiError(404, "Booking not found");
  if (!allowed.includes(booking.status)) {
    throw new ApiError(400, `Cannot ${label} a booking in status "${booking.status}"`);
  }
  return booking;
}

export async function approveBooking(id: string, assistantId: string) {
  await assertTransition(id, ["PENDING"], "approve");
  return db.booking.update({
    where: { id },
    data: { status: "APPROVED", approvedAt: new Date(), approvedById: assistantId },
  });
}

export async function rejectBooking(id: string, assistantId: string) {
  await assertTransition(id, ["PENDING"], "reject");
  return db.booking.update({
    where: { id },
    data: { status: "REJECTED", approvedAt: new Date(), approvedById: assistantId },
  });
}

export async function issueBooking(id: string, assistantId: string) {
  const booking = await assertTransition(id, ["APPROVED"], "issue");
  const loanPeriodDays = await getLoanPeriodDays();
  const now = new Date();
  const dueAt = new Date(now.getTime() + loanPeriodDays * 24 * 60 * 60 * 1000);

  return db.$transaction(async (tx) => {
    await reserveStock(booking.items.map((i) => ({ equipmentId: i.equipmentId, quantity: i.quantity })), tx);
    for (const item of booking.items) {
      const eq = await tx.equipment.findUnique({ where: { id: item.equipmentId } });
      await tx.bookingItem.update({
        where: { id: item.id },
        data: { conditionOnIssue: eq?.condition ?? null },
      });
    }
    return tx.booking.update({
      where: { id },
      data: {
        status: "ISSUED",
        issuedAt: now,
        dueAt,
        approvedAt: booking.approvedAt ?? now,
        approvedById: booking.approvedById ?? assistantId,
      },
    });
  });
}

export async function returnBooking(id: string, input: ReturnBookingInput) {
  const booking = await assertTransition(id, ["ISSUED", "OVERDUE"], "return");
  const ratePerDay = await getFineRatePerDay();
  const now = new Date();

  return db.$transaction(async (tx) => {
    await releaseStock(booking.items.map((i) => ({ equipmentId: i.equipmentId, quantity: i.quantity })), tx);

    const returnMap = new Map((input.items ?? []).map((i) => [i.equipmentId, i.condition]));
    for (const item of booking.items) {
      const conditionOnReturn = returnMap.get(item.equipmentId) ?? null;
      await tx.bookingItem.update({
        where: { id: item.id },
        data: { conditionOnReturn },
      });
      if (conditionOnReturn) {
        await tx.equipment.update({
          where: { id: item.equipmentId },
          data: { condition: conditionOnReturn },
        });
      }
    }

    let fine = null;
    if (booking.dueAt && now > booking.dueAt) {
      fine = await createFineForReturn(
        {
          bookingId: booking.id,
          studentId: booking.studentId,
          dueAt: booking.dueAt,
          returnedAt: now,
          ratePerDay,
        },
        tx
      );
    }

    const updated = await tx.booking.update({
      where: { id },
      data: { status: "RETURNED", returnedAt: now },
      include: { items: { include: { equipment: true } }, fine: true },
    });
    return { booking: updated, fine };
  });
}

/** Flags issued bookings whose deadline has passed as OVERDUE. Returns the count changed. */
export async function markOverdueBookings(): Promise<number> {
  const result = await db.booking.updateMany({
    where: { status: "ISSUED", dueAt: { lt: new Date() } },
    data: { status: "OVERDUE" },
  });
  return result.count;
}
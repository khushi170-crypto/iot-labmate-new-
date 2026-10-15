import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import { computeDaysLate, computeFineAmount } from "@/lib/fine-calc";
import type { Fine, FineStatus, Prisma } from "@/generated/prisma/client";

type Tx = Prisma.TransactionClient;

export { computeDaysLate, computeFineAmount };

export interface FineInput {
  bookingId: string;
  studentId: string;
  dueAt: Date;
  returnedAt: Date;
  ratePerDay: number;
}

/** Creates (and returns) a fine when the return is late, otherwise null. */
export async function createFineForReturn(
  input: FineInput,
  tx?: Tx
): Promise<Fine | null> {
  const daysLate = computeDaysLate(input.dueAt, input.returnedAt);
  if (daysLate === 0) return null;
  const amount = computeFineAmount(daysLate, input.ratePerDay);
  const run = (client: Tx) =>
    client.fine.create({
      data: {
        bookingId: input.bookingId,
        studentId: input.studentId,
        amount,
        daysLate,
        rateApplied: input.ratePerDay,
      },
    });
  if (tx) return run(tx);
  return db.$transaction(run);
}

export async function listFines(opts: { studentId?: string; includeRelations?: boolean } = {}) {
  return db.fine.findMany({
    where: opts.studentId ? { studentId: opts.studentId } : undefined,
    include: opts.includeRelations
      ? {
          booking: { include: { items: { include: { equipment: true } } } },
          student: { select: { id: true, name: true, email: true } },
          payments: { orderBy: { createdAt: "desc" } },
        }
      : { booking: true, payments: { orderBy: { createdAt: "desc" } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export function isFinePair(status: FineStatus): boolean {
  return status === "PAID" || status === "WAIVED";
}

export async function updateFineStatus(fineId: string, status: FineStatus) {
  const fine = await db.fine.findUnique({ where: { id: fineId } });
  if (!fine) throw new ApiError(404, "Fine not found");
  return db.fine.update({
    where: { id: fineId },
    data: {
      status,
      paidAt: isFinePair(status) ? new Date() : null,
    },
  });
}
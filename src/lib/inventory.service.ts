import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import type { Prisma } from "@/generated/prisma/client";

export interface StockLine {
  equipmentId: string;
  quantity: number;
}

type Tx = Prisma.TransactionClient;

function runInTx<T>(tx: Tx | undefined, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return tx ? fn(tx) : db.$transaction(fn);
}

/** Verifies stock exists for all requested lines without mutating anything. */
export async function assertStock(lines: StockLine[]): Promise<void> {
  if (lines.length === 0) throw new ApiError(400, "No items provided");
  const ids = lineIds(lines);
  const equipment = await db.equipment.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, availableQty: true, isActive: true },
  });
  const map = new Map(equipment.map((e) => [e.id, e]));
  const problems: string[] = [];
  for (const line of lines) {
    const eq = map.get(line.equipmentId);
    if (!eq) {
      problems.push("Some equipment no longer exists");
    } else if (!eq.isActive) {
      problems.push(`${eq.name} is no longer available`);
    } else if (eq.availableQty < line.quantity) {
      problems.push(`${eq.name}: only ${eq.availableQty} available, requested ${line.quantity}`);
    }
  }
  if (problems.length > 0) throw new ApiError(409, [...new Set(problems)].join(". "));
}

/** Decrements availableQty atomically. Throws if any line can't be fulfilled. */
export async function reserveStock(lines: StockLine[], tx?: Tx): Promise<void> {
  await runInTx(tx, async (client) => {
    for (const line of lines) {
      const result = await client.equipment.updateMany({
        where: { id: line.equipmentId, availableQty: { gte: line.quantity } },
        data: { availableQty: { decrement: line.quantity } },
      });
      if (result.count !== 1) {
        throw new ApiError(409, "Stock changed while processing — availability not guaranteed");
      }
    }
  });
}

/** Increments availableQty back after a return. */
export async function releaseStock(lines: StockLine[], tx?: Tx): Promise<void> {
  await runInTx(tx, async (client) => {
    for (const line of lines) {
      const eq = await client.equipment.findUnique({
        where: { id: line.equipmentId },
        select: { id: true, totalQty: true },
      });
      if (!eq) continue;
      const updated = await client.equipment.update({
        where: { id: line.equipmentId },
        data: { availableQty: { increment: line.quantity } },
      });
      if (updated.availableQty > updated.totalQty) {
        await client.equipment.update({
          where: { id: line.equipmentId },
          data: { availableQty: updated.totalQty },
        });
      }
    }
  });
}

function lineIds(lines: StockLine[]): string[] {
  return [...new Set(lines.map((l) => l.equipmentId))];
}
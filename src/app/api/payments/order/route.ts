import { z } from "zod";
import { apiError, fail, json, requireApiUser } from "@/lib/api";
import { createFinePaymentOrder } from "@/lib/payments.service";
import { createPaymentOrderSchema } from "@/lib/validators";
import { Role } from "@/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser([Role.STUDENT]);
    const parsed = createPaymentOrderSchema.parse(await request.json());
    const order = await createFinePaymentOrder(parsed.fineId, user);
    return json(order);
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error.issues[0]?.message ?? "Invalid input", 422);
    return apiError(error);
  }
}

import { z } from "zod";
import { apiError, fail, json, requireApiUser } from "@/lib/api";
import { verifyFinePayment } from "@/lib/payments.service";
import { verifyPaymentSchema } from "@/lib/validators";
import { Role } from "@/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser([Role.STUDENT]);
    const parsed = verifyPaymentSchema.parse(await request.json());

    const result = await verifyFinePayment(
      {
        fineId: parsed.fineId,
        orderId: parsed.razorpay_order_id,
        paymentId: parsed.razorpay_payment_id,
        signature: parsed.razorpay_signature,
      },
      user
    );

    return json({
      fineId: result.fine.id,
      status: result.fine.status,
      paidAt: result.fine.paidAt,
      alreadyPaid: result.alreadyPaid,
      transaction: {
        orderId: result.payment.orderId,
        paymentId: result.payment.paymentId,
        amount: result.payment.amount,
        currency: result.payment.currency,
        method: result.payment.method,
        status: result.payment.status,
        gatewayStatus: result.payment.gatewayStatus,
        verifiedAt: result.payment.verifiedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return fail(error.issues[0]?.message ?? "Invalid input", 422);
    return apiError(error);
  }
}

import { db } from "@/lib/db";
import { ApiError } from "@/lib/api";
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  getRazorpayConfig,
  isRazorpayConfigured,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import type { Fine, Payment } from "@/generated/prisma/client";

/**
 * Online fine payments.
 *
 * Lifecycle of a payment:
 *   CREATED  -> an order was created at Razorpay and stored locally
 *   PAID     -> the checkout signature was verified AND the gateway confirmed it
 *   FAILED   -> verification failed or the gateway reported a non-success status
 *
 * A fine is only flipped to PAID after a *verified* payment, so it is impossible
 * to mark a fine paid without a genuine Razorpay transaction.
 */

const MIN_AMOUNT_MINOR = 100;

export interface Payer {
  id: string;
  name: string;
  email: string;
}

export function onlinePaymentsEnabled(): boolean {
  return isRazorpayConfigured();
}

export interface FineOrderResult {
  fineId: string;
  orderId: string;
  amount: number;
  amountMinor: number;
  currency: string;
  keyId: string;
  name: string;
  description: string;
  prefill: { name: string; email: string };
}

export async function createFinePaymentOrder(fineId: string, payer: Payer): Promise<FineOrderResult> {
  if (!isRazorpayConfigured()) {
    throw new ApiError(
      503,
      "Online payments are not configured. Ask the lab assistant to collect this fine manually."
    );
  }

  const fine = await db.fine.findUnique({
    where: { id: fineId },
    include: { booking: { select: { code: true } } },
  });
  if (!fine) throw new ApiError(404, "Fine not found");
  if (fine.studentId !== payer.id) throw new ApiError(403, "You can only pay your own fines");
  if (fine.status !== "UNPAID") throw new ApiError(409, "This fine is already settled");

  const { currency, keyId } = getRazorpayConfig();
  const amountMinor = Math.round(fine.amount * 100);
  if (amountMinor < MIN_AMOUNT_MINOR) {
    throw new ApiError(400, `The fine amount is below the online minimum (${currency} 1.00)`);
  }

  const order = await createRazorpayOrder({
    amountMinor,
    currency,
    receipt: fine.id,
    notes: { fineId: fine.id, bookingCode: fine.booking.code, studentId: payer.id },
  });

  await db.payment.create({
    data: {
      fineId: fine.id,
      studentId: payer.id,
      orderId: order.id,
      amount: fine.amount,
      currency,
      status: "CREATED",
    },
  });

  return {
    fineId: fine.id,
    orderId: order.id,
    amount: fine.amount,
    amountMinor,
    currency,
    keyId,
    name: "IoT LabMate",
    description: `Fine for booking ${fine.booking.code}`,
    prefill: { name: payer.name, email: payer.email },
  };
}

export interface VerifyFinePaymentResult {
  fine: Fine;
  payment: Payment;
  alreadyPaid: boolean;
  gatewayStatus: string | null;
}

export async function verifyFinePayment(
  input: { fineId: string; orderId: string; paymentId: string; signature: string },
  payer: Payer
): Promise<VerifyFinePaymentResult> {
  const payment = await db.payment.findUnique({ where: { orderId: input.orderId } });
  if (!payment) throw new ApiError(404, "Payment order not found");
  if (payment.studentId !== payer.id) throw new ApiError(403, "You can only verify your own payments");
  if (payment.fineId !== input.fineId) {
    throw new ApiError(400, "This payment does not belong to the selected fine");
  }

  // Idempotent: replaying a successful verification just returns the stored result.
  if (payment.status === "PAID") {
    const fine = await db.fine.findUnique({ where: { id: payment.fineId } });
    if (!fine) throw new ApiError(404, "Fine not found");
    return { fine, payment, alreadyPaid: true, gatewayStatus: payment.gatewayStatus };
  }

  if (
    !verifyRazorpaySignature({
      orderId: input.orderId,
      paymentId: input.paymentId,
      signature: input.signature,
    })
  ) {
    await db.payment
      .update({
        where: { id: payment.id },
        data: { status: "FAILED", failureReason: "Signature verification failed" },
      })
      .catch(() => undefined);
    throw new ApiError(400, "Payment verification failed: the signature does not match");
  }

  // Enrich with gateway data and confirm the payment really succeeded. If the
  // lookup itself fails we still trust the (already verified) signature, but a
  // non-successful status from the gateway aborts the update.
  let gatewayStatus: string | null = null;
  let method: string | null = null;
  try {
    const gateway = await fetchRazorpayPayment(input.paymentId);
    if (gateway.order_id !== input.orderId) {
      throw new ApiError(400, "Payment does not match this order");
    }
    gatewayStatus = gateway.status;
    method = gateway.method ?? null;
    if (gateway.status && !["captured", "authorized"].includes(gateway.status)) {
      await db.payment
        .update({
          where: { id: payment.id },
          data: {
            paymentId: input.paymentId,
            method,
            gatewayStatus,
            status: "FAILED",
            failureReason: `Gateway status: ${gateway.status}`,
          },
        })
        .catch(() => undefined);
      throw new ApiError(400, `Payment was not completed (gateway status: ${gateway.status})`);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    // Network hiccup on the lookup — the signature already proves authenticity.
  }

  const settled = await db.$transaction(async (tx) => {
    const savedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        paymentId: input.paymentId,
        signature: input.signature,
        method,
        gatewayStatus,
        status: "PAID",
        verifiedAt: new Date(),
        failureReason: null,
      },
    });

    const current = await tx.fine.findUnique({ where: { id: payment.fineId } });
    if (!current) throw new ApiError(404, "Fine not found");

    const savedFine =
      current.status === "UNPAID"
        ? await tx.fine.update({
            where: { id: current.id },
            data: { status: "PAID", paidAt: new Date() },
          })
        : current;

    return { fine: savedFine, payment: savedPayment };
  });

  return { ...settled, alreadyPaid: false, gatewayStatus };
}

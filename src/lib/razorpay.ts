import { envString } from "@/lib/env";
import { ApiError } from "@/lib/api";
import { verifyRazorpaySignature as verifySignature } from "@/lib/razorpay-signature";

/**
 * Minimal Razorpay REST client. We intentionally avoid the `razorpay` SDK so the
 * project stays dependency-free; the Orders API only needs Basic auth over HTTPS
 * and signature verification is a single HMAC-SHA256.
 *
 * All calls are server-only (they use the secret key) and must never run in the browser.
 */

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  currency: string;
}

export function getRazorpayConfig(): RazorpayConfig {
  return {
    keyId: envString("RAZORPAY_KEY_ID"),
    keySecret: envString("RAZORPAY_KEY_SECRET"),
    currency: envString("RAZORPAY_CURRENCY", "INR").toUpperCase(),
  };
}

export function isRazorpayConfigured(): boolean {
  const { keyId, keySecret } = getRazorpayConfig();
  return Boolean(keyId && keySecret);
}

function authHeader(keyId: string, keySecret: string): string {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt: string | null;
}

export async function createRazorpayOrder(input: {
  amountMinor: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const { keyId, keySecret } = getRazorpayConfig();
  if (!keyId || !keySecret) {
    throw new ApiError(503, "Online payments are not configured on the server");
  }

  const res = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: authHeader(keyId, keySecret),
    },
    body: JSON.stringify({
      amount: input.amountMinor,
      currency: input.currency,
      receipt: input.receipt.slice(0, 40),
      notes: input.notes ?? {},
      payment_capture: 1,
    }),
  });

  const body = (await res.json().catch(() => null)) as
    | (RazorpayOrder & { error?: { description?: string } })
    | null;

  if (!res.ok || !body?.id) {
    const description = body?.error?.description ?? `Razorpay order failed (${res.status})`;
    throw new ApiError(res.status >= 500 ? 502 : 400, description);
  }
  return body;
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
}

export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  const { keyId, keySecret } = getRazorpayConfig();
  const res = await fetch(`${RAZORPAY_API_BASE}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { authorization: authHeader(keyId, keySecret) },
  });
  const body = (await res.json().catch(() => null)) as
    | (RazorpayPayment & { error?: { description?: string } })
    | null;
  if (!res.ok || !body?.id) {
    const description = body?.error?.description ?? `Razorpay payment lookup failed (${res.status})`;
    throw new ApiError(502, description);
  }
  return body;
}

/**
 * Verifies a Razorpay checkout signature. The gateway signs `order_id|payment_id`
 * with the account secret; only a valid signature proves the payment is genuine.
 */
export function verifyRazorpaySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  return verifySignature({ ...input, secret: getRazorpayConfig().keySecret });
}

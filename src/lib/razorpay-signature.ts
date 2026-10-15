import crypto from "node:crypto";

/**
 * Pure Razorpay signature helpers (no env/Next imports) so both the server
 * service and the test suite can use them safely.
 *
 * Razorpay signs the string `order_id|payment_id` with the account secret using
 * HMAC-SHA256. Only a matching signature proves the checkout response is genuine.
 */

export function computeRazorpaySignature(orderId: string, paymentId: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
}

export function verifyRazorpaySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  secret: string;
}): boolean {
  if (!input.secret) return false;

  const expected = computeRazorpaySignature(input.orderId, input.paymentId, input.secret);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(input.signature ?? "", "utf8");
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
}

import { describe, expect, it } from "vitest";
import { computeRazorpaySignature, verifyRazorpaySignature } from "@/lib/razorpay-signature";

const secret = "rzp_test_secret";
const orderId = "order_ABC123";
const paymentId = "pay_XYZ789";

describe("computeRazorpaySignature", () => {
  it("produces the documented HMAC-SHA256 of order_id|payment_id", () => {
    const expected = computeRazorpaySignature(orderId, paymentId, secret);
    expect(expected).toMatch(/^[a-f0-9]{64}$/);
    expect(computeRazorpaySignature(orderId, paymentId, secret)).toBe(expected);
  });

  it("changes when any input changes", () => {
    const base = computeRazorpaySignature(orderId, paymentId, secret);
    expect(computeRazorpaySignature("order_OTHER", paymentId, secret)).not.toBe(base);
    expect(computeRazorpaySignature(orderId, "pay_OTHER", secret)).not.toBe(base);
    expect(computeRazorpaySignature(orderId, paymentId, "another_secret")).not.toBe(base);
  });
});

describe("verifyRazorpaySignature", () => {
  it("accepts a genuine signature", () => {
    const signature = computeRazorpaySignature(orderId, paymentId, secret);
    expect(verifyRazorpaySignature({ orderId, paymentId, signature, secret })).toBe(true);
  });

  it("rejects a tampered signature", () => {
    const signature = computeRazorpaySignature(orderId, paymentId, secret);
    expect(
      verifyRazorpaySignature({ orderId, paymentId, signature: `${signature.slice(0, -1)}0`, secret })
    ).toBe(false);
  });

  it("rejects a signature computed with the wrong secret", () => {
    const signature = computeRazorpaySignature(orderId, paymentId, "attacker_secret");
    expect(verifyRazorpaySignature({ orderId, paymentId, signature, secret })).toBe(false);
  });

  it("rejects empty secrets or signatures", () => {
    const signature = computeRazorpaySignature(orderId, paymentId, secret);
    expect(verifyRazorpaySignature({ orderId, paymentId, signature, secret: "" })).toBe(false);
    expect(verifyRazorpaySignature({ orderId, paymentId, signature: "", secret })).toBe(false);
  });
});

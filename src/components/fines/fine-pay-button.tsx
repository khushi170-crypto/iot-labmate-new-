"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentDetails } from "@/components/fines/payment-details";
import { apiFetch, ApiClientError } from "@/lib/fetcher";
import type { FineStatus } from "@/generated/prisma/client";
import type { PaymentView } from "@/lib/types";

interface RazorpayOrderResponse {
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

interface RazorpaySuccessPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface VerifyResponse {
  fineId: string;
  status: FineStatus;
  alreadyPaid: boolean;
  transaction: {
    orderId: string;
    paymentId: string | null;
    amount: number;
    currency: string;
    method: string | null;
    status: "CREATED" | "PAID" | "FAILED";
    gatewayStatus: string | null;
    verifiedAt: string | null;
  };
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler?: (response: RazorpaySuccessPayload) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayCheckout {
  open: () => void;
  on: (event: string, handler: (payload: unknown) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckout;
  }
}

let scriptPromise: Promise<boolean> | null = null;

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<boolean>((resolve) => {
    const existing = document.getElementById("razorpay-checkout-js") as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
    script.addEventListener("error", () => {
      scriptPromise = null;
      resolve(false);
    });
    if (!existing) document.body.appendChild(script);
  });
  return scriptPromise;
}

function toPaymentView(transaction: VerifyResponse["transaction"]): PaymentView {
  return {
    id: transaction.orderId,
    orderId: transaction.orderId,
    paymentId: transaction.paymentId,
    amount: transaction.amount,
    currency: transaction.currency,
    status: transaction.status,
    method: transaction.method,
    gatewayStatus: transaction.gatewayStatus,
    failureReason: null,
    createdAt: transaction.verifiedAt ?? new Date().toISOString(),
    verifiedAt: transaction.verifiedAt,
  };
}

export function FinePayButton({
  fineId,
  bookingCode,
  status,
  payments,
  paymentsEnabled = true,
}: {
  fineId: string;
  bookingCode?: string;
  status: FineStatus;
  payments?: PaymentView[];
  paymentsEnabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; payment: PaymentView } | null>(null);

  const persistedPaid = payments?.find((p) => p.status === "PAID") ?? null;
  const paidView = success?.payment ?? persistedPaid;

  async function verifyPayment(response: RazorpaySuccessPayload) {
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch<VerifyResponse>("/api/payments/verify", {
        method: "POST",
        body: JSON.stringify({
          fineId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });
      setSuccess({
        message: result.alreadyPaid
          ? "This fine was already paid."
          : "Payment successful — the fine is now marked as Paid.",
        payment: toPaymentView(result.transaction),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Payment verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function startPayment() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const order = await apiFetch<RazorpayOrderResponse>("/api/payments/order", {
        method: "POST",
        body: JSON.stringify({ fineId }),
      });

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setError("Could not load the Razorpay checkout. Check your connection and try again.");
        return;
      }

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amountMinor,
        currency: order.currency,
        order_id: order.orderId,
        name: order.name,
        description: order.description,
        prefill: order.prefill,
        theme: { color: "#22d3ee" },
        handler: (response) => {
          void verifyPayment(response);
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });

      checkout.on("payment.failed", (payload) => {
        const description = (payload as { error?: { description?: string } })?.error?.description;
        setError(description ? `Payment failed: ${description}` : "Payment failed. Please try again.");
        setBusy(false);
      });

      checkout.open();
      setBusy(false);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not start the payment");
      setBusy(false);
    }
  }

  if (paidView) {
    return (
      <div className="mt-2">
        <p className="flex items-center gap-1.5 text-sm font-medium text-success">
          <CheckCircle2 className="size-4" />
          {success?.message ?? "Paid online via Razorpay."}
        </p>
        <PaymentDetails payment={paidView} />
      </div>
    );
  }

  if (status !== "UNPAID") return null;

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" loading={busy} disabled={!paymentsEnabled} onClick={startPayment}>
          <CreditCard className="size-3.5" /> Pay Now
        </Button>
        {bookingCode ? <span className="text-xs text-muted">Secure payment for {bookingCode}</span> : null}
      </div>
      {!paymentsEnabled ? (
        <p className="mt-1 text-xs text-muted">
          Online payment is not configured. Ask the lab assistant to collect this fine.
        </p>
      ) : null}
      {error ? (
        <p className="mt-1 flex items-center gap-1.5 text-xs text-danger">
          <TriangleAlert className="size-3.5" /> {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Cashfree webhook handler for PLATFORM subscription payments.
 * Triggered when an organisation pays for a Znifa plan.
 * Endpoint: POST /api/webhooks/cashfree/platform
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCashfreeWebhook } from "@/lib/cashfree/verifyWebhook";
import type { PlatformInterval } from "@/lib/supabase/types";

interface CashfreeWebhookPayload {
  type: string;
  data: {
    order: { order_id: string; order_amount: number };
    payment: {
      cf_payment_id: string;
      payment_status: string;
      payment_amount: number;
    };
  };
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-webhook-signature") ?? "";
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const rawBody = await req.text();

  const secretKey = process.env.CASHFREE_SECRET_KEY!;
  if (!verifyCashfreeWebhook(rawBody, signature, timestamp, secretKey)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: CashfreeWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const cfOrderId = payload.data?.order?.order_id;
  const cfPaymentId = payload.data?.payment?.cf_payment_id;
  const eventType = payload.type;

  if (!cfOrderId) {
    return NextResponse.json({ ok: true });
  }

  // Only handle orders created by the platform subscribe route
  if (!cfOrderId.startsWith("ZNIFA-PLATFORM-")) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createServiceClient();

  // Find the pending platform_payment
  const { data: platformPayment } = await supabase
    .from("platform_payments")
    .select("id, org_id, plan_id, billing_interval, amount")
    .eq("cf_order_id", cfOrderId)
    .single();

  if (!platformPayment) {
    return NextResponse.json({ ok: true });
  }

  if (eventType === "PAYMENT_SUCCESS") {
    // Activate the platform subscription via DB function
    await supabase.rpc("activate_platform_sub", {
      p_org_id: platformPayment.org_id,
      p_plan_id: platformPayment.plan_id,
      p_cf_order_id: cfOrderId,
      p_cf_payment_id: cfPaymentId,
      p_interval: platformPayment.billing_interval as PlatformInterval,
      p_amount: platformPayment.amount,
    });
  } else if (
    eventType === "PAYMENT_FAILED" ||
    eventType === "PAYMENT_USER_DROPPED"
  ) {
    // Mark the payment as failed
    await supabase
      .from("platform_payments")
      .update({ payment_status: "failed", cf_payment_id: cfPaymentId })
      .eq("cf_order_id", cfOrderId);
  }

  return NextResponse.json({ ok: true });
}

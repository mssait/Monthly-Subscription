import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { verifyCashfreeWebhook } from "@/lib/cashfree/verifyWebhook";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-webhook-signature") ?? "";
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const rawBody = await req.text();

  // Verify webhook signature using platform-level secret
  const secretKey = process.env.CASHFREE_SECRET_KEY!;
  if (!verifyCashfreeWebhook(rawBody, signature, timestamp, secretKey)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    type: string;
    data: {
      order: { order_id: string; order_amount: number };
      payment: {
        cf_payment_id: string;
        payment_status: string;
        payment_amount: number;
        payment_method?: Record<string, unknown>;
      };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const cfOrderId = payload.data?.order?.order_id;
  const cfPaymentId = payload.data?.payment?.cf_payment_id;
  const eventType = payload.type;

  if (!cfOrderId) {
    return NextResponse.json({ ok: true }); // Ignore events without order ID
  }

  // Find the payment record
  const { data: payment } = await supabase
    .from("payments")
    .select("id, org_id, subscription_id, member_id")
    .eq("cf_order_id", cfOrderId)
    .single();

  if (!payment) {
    return NextResponse.json({ ok: true }); // Payment not found, ignore
  }

  let newStatus: "paid" | "failed" | "pending" = "pending";

  if (eventType === "PAYMENT_SUCCESS") {
    newStatus = "paid";
  } else if (eventType === "PAYMENT_FAILED" || eventType === "PAYMENT_USER_DROPPED") {
    newStatus = "failed";
  } else {
    return NextResponse.json({ ok: true }); // Unhandled event type
  }

  // Update payment status
  await supabase
    .from("payments")
    .update({
      payment_status: newStatus,
      cf_payment_id: cfPaymentId,
    })
    .eq("id", payment.id);

  // If paid, update subscription next_due_date
  if (newStatus === "paid" && payment.subscription_id) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*, subscription_plans(billing_cycle, custom_days)")
      .eq("id", payment.subscription_id)
      .single();

    if (sub) {
      const { calculateNextDueDate, toISODate } = await import("@/lib/utils/date");
      const plan = sub.subscription_plans as { billing_cycle: import("@/lib/supabase/types").BillingCycle; custom_days: number | null } | null;
      if (plan && sub.next_due_date && plan.billing_cycle !== "one_time") {
        const nextDue = toISODate(
          calculateNextDueDate(sub.next_due_date, plan.billing_cycle, plan.custom_days)
        );
        await supabase
          .from("subscriptions")
          .update({
            next_due_date: nextDue,
            status: "active",
          })
          .eq("id", payment.subscription_id);
      }
    }
  }

  return NextResponse.json({ ok: true });
}

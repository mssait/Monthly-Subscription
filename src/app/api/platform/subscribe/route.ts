import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createCashfreeOrder } from "@/lib/cashfree/createOrder";
import { getDefaultCashfreeConfig } from "@/lib/cashfree/client";
import type { PlatformInterval } from "@/lib/supabase/types";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      org_id,
      plan_id,
      billing_interval = "monthly",
    }: {
      org_id: string;
      plan_id: string;
      billing_interval?: PlatformInterval;
    } = await req.json();

    if (!org_id || !plan_id) {
      return NextResponse.json(
        { error: "org_id and plan_id are required" },
        { status: 400 }
      );
    }

    const serviceClient = await createServiceClient();

    // Verify user is org_admin of the org
    const { data: membership } = await serviceClient
      .from("org_members")
      .select("role")
      .eq("org_id", org_id)
      .eq("user_id", user.id)
      .single();

    if (!membership || membership.role !== "org_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Load plan details
    const { data: plan } = await serviceClient
      .from("platform_plans")
      .select("id, name, price_monthly, price_yearly")
      .eq("id", plan_id)
      .eq("is_active", true)
      .single();

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    const amount =
      billing_interval === "yearly" ? plan.price_yearly : plan.price_monthly;

    // Load org and user details for Cashfree customer info
    const { data: org } = await serviceClient
      .from("organizations")
      .select("name, email, phone, slug")
      .eq("id", org_id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: "Organisation not found" },
        { status: 404 }
      );
    }

    const config = getDefaultCashfreeConfig();
    const orderId = `ZNIFA-PLATFORM-${org_id.slice(0, 8)}-${Date.now()}`;
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const cfOrder = await createCashfreeOrder(config, {
      orderId,
      orderAmount: amount,
      customerName: org.name,
      customerPhone: org.phone ?? "0000000000",
      customerEmail: org.email ?? user.email ?? "",
      orderNote: `Znifa ${plan.name} plan – ${billing_interval}`,
      returnUrl: `${appUrl}/org/${org.slug}/billing?cf_order_id=${orderId}`,
      notifyUrl: `${appUrl}/api/webhooks/cashfree/platform`,
    });

    // Create a pending platform_payment record
    await serviceClient.from("platform_payments").insert({
      org_id,
      plan_id,
      amount,
      currency: "INR",
      billing_interval,
      payment_status: "pending",
      cf_order_id: orderId,
    });

    return NextResponse.json({
      order_id: orderId,
      payment_session_id: cfOrder.payment_session_id,
      amount,
      plan_name: plan.name,
      billing_interval,
    });
  } catch (err) {
    console.error("platform subscribe error:", err);
    return NextResponse.json(
      { error: "Failed to create subscription order" },
      { status: 500 }
    );
  }
}

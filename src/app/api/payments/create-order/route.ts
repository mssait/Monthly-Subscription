import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createCashfreeOrder } from "@/lib/cashfree/createOrder";
import { decrypt } from "@/lib/utils/encryption";
import type { CashfreeConfig } from "@/lib/cashfree/client";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { org_id, member_id, subscription_id, amount, order_note } = await req.json();

    // Load org Cashfree credentials
    const serviceClient = await createServiceClient();
    const { data: org } = await serviceClient
      .from("organizations")
      .select("cashfree_app_id, cashfree_secret, cashfree_env, slug")
      .eq("id", org_id)
      .single();

    if (!org?.cashfree_app_id || !org?.cashfree_secret) {
      return NextResponse.json(
        { error: "Cashfree credentials not configured. Please update settings." },
        { status: 400 }
      );
    }

    // Load member details
    const { data: member } = await serviceClient
      .from("members")
      .select("first_name, last_name, phone, email")
      .eq("id", member_id)
      .single();

    if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

    const config: CashfreeConfig = {
      appId: org.cashfree_app_id,
      secretKey: decrypt(org.cashfree_secret),
      env: (org.cashfree_env ?? "sandbox") as "sandbox" | "production",
    };

    const orderId = `ZNIFA-${org_id.slice(0, 8)}-${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const cfOrder = await createCashfreeOrder(config, {
      orderId,
      orderAmount: amount,
      customerName: `${member.first_name} ${member.last_name ?? ""}`.trim(),
      customerPhone: member.phone,
      customerEmail: member.email ?? undefined,
      orderNote: order_note ?? "Subscription payment",
      returnUrl: `${appUrl}/org/${org.slug}/payments?cf_order_id=${orderId}`,
      notifyUrl: `${appUrl}/api/webhooks/cashfree`,
    });

    // Create a pending payment record
    await serviceClient.from("payments").insert({
      org_id,
      member_id,
      subscription_id: subscription_id || null,
      amount,
      payment_method: "upi",
      payment_status: "pending",
      cf_order_id: orderId,
      payment_date: new Date().toISOString().split("T")[0],
      created_by: user.id,
    });

    return NextResponse.json({
      order_id: orderId,
      payment_session_id: cfOrder.payment_session_id,
    });
  } catch (err) {
    console.error("create-order error:", err);
    return NextResponse.json({ error: "Failed to create payment order" }, { status: 500 });
  }
}

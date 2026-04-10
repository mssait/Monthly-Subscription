import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { PaymentMethod } from "@/lib/supabase/types";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      org_id,
      member_id,
      subscription_id,
      amount,
      payment_method,
      payment_date,
      reference_number,
      period_start,
      period_end,
      notes,
      next_due_date,
    } = await req.json();

    const { data, error } = await supabase.rpc("record_manual_payment", {
      p_org_id: org_id,
      p_member_id: member_id,
      p_subscription_id: subscription_id || null,
      p_amount: amount,
      p_payment_method: payment_method as PaymentMethod,
      p_payment_date: payment_date,
      p_reference_number: reference_number || null,
      p_period_start: period_start || null,
      p_period_end: period_end || null,
      p_notes: notes || null,
      p_next_due_date: next_due_date || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

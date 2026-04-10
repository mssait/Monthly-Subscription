import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("member_id");
    const orgId = searchParams.get("org_id");

    if (!memberId || !orgId) {
      return NextResponse.json([], { status: 200 });
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select(`*, subscription_plans(name, amount, billing_cycle, custom_days)`)
      .eq("member_id", memberId)
      .eq("org_id", orgId)
      .in("status", ["active", "overdue", "paused"]);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("subscriptions")
      .insert({ ...body, created_by: user.id })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

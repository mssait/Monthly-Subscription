import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { name, slug, org_type, user_id } = await req.json();

    if (!name || !slug || !user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    // Check slug is unique
    const { data: existing } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      return NextResponse.json({ error: "This URL slug is already taken" }, { status: 409 });
    }

    // Create org
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({ name, slug, org_type })
      .select()
      .single();

    if (orgError || !org) {
      return NextResponse.json({ error: orgError?.message ?? "Failed to create org" }, { status: 500 });
    }

    // Add user as org_admin
    const { error: memberError } = await supabase
      .from("org_members")
      .insert({ org_id: org.id, user_id, role: "org_admin" });

    if (memberError) {
      // Rollback org creation
      await supabase.from("organizations").delete().eq("id", org.id);
      return NextResponse.json({ error: "Failed to assign admin role" }, { status: 500 });
    }

    // Start a 14-day free trial on the Starter plan
    await supabase.rpc("start_org_trial", { p_org_id: org.id });

    return NextResponse.json(org, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

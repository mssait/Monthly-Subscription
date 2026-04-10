import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { arrayToCSV } from "@/lib/utils/csv";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("org_id");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!orgId) return NextResponse.json({ error: "org_id required" }, { status: 400 });

    let query = supabase
      .from("payments")
      .select(`
        receipt_number, payment_date, amount, payment_method, payment_status,
        reference_number, notes, period_start, period_end,
        members(first_name, last_name, member_number, phone)
      `)
      .eq("org_id", orgId)
      .order("payment_date", { ascending: false });

    if (from) query = query.gte("payment_date", from);
    if (to) query = query.lte("payment_date", to);

    const { data: payments, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const rows = (payments ?? []).map((p) => {
      const m = p.members as { first_name: string; last_name: string | null; member_number: string | null; phone: string } | null;
      return {
        "Receipt No": p.receipt_number ?? "",
        "Date": p.payment_date,
        "Member Name": `${m?.first_name ?? ""} ${m?.last_name ?? ""}`.trim(),
        "Member No": m?.member_number ?? "",
        "Phone": m?.phone ?? "",
        "Amount (INR)": p.amount,
        "Method": p.payment_method,
        "Status": p.payment_status,
        "Reference": p.reference_number ?? "",
        "Period From": p.period_start ?? "",
        "Period To": p.period_end ?? "",
        "Notes": p.notes ?? "",
      };
    });

    const csv = arrayToCSV(rows);
    const filename = `payments_${from ?? "all"}_to_${to ?? "all"}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

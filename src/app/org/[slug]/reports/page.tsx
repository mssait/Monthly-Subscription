import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatINR } from "@/lib/utils/currency";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ReportsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { from, to } = await searchParams;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  // Default: current month
  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultTo = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];

  const dateFrom = from ?? defaultFrom;
  const dateTo = to ?? defaultTo;

  // Collections in period
  const { data: collections } = await supabase
    .from("payments")
    .select("amount, payment_method, payment_date, members(first_name, last_name, member_number)")
    .eq("org_id", org.id)
    .eq("payment_status", "paid")
    .gte("payment_date", dateFrom)
    .lte("payment_date", dateTo)
    .order("payment_date", { ascending: false });

  const totalCollection = collections?.reduce((sum, p) => sum + p.amount, 0) ?? 0;

  // Overdue subscriptions
  const { data: overdue } = await supabase
    .from("subscriptions")
    .select(`*, members(first_name, last_name, member_number, phone), subscription_plans(name, amount)`)
    .eq("org_id", org.id)
    .eq("status", "overdue")
    .order("next_due_date");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">{org.name}</p>
      </div>

      {/* Date filter */}
      <form className="flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input
            type="date"
            name="from"
            defaultValue={dateFrom}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input
            type="date"
            name="to"
            defaultValue={dateTo}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Filter
        </button>
        <Link
          href={`/api/exports/payments?org_id=${org.id}&from=${dateFrom}&to=${dateTo}`}
          className="rounded-md border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Export CSV
        </Link>
      </form>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Total collected</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{formatINR(totalCollection)}</p>
          <p className="text-xs text-gray-400 mt-1">{collections?.length ?? 0} transactions</p>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Overdue subscriptions</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{overdue?.length ?? 0}</p>
          <p className="text-xs text-gray-400 mt-1">
            Est. {formatINR(overdue?.reduce((s, o) => s + ((o.subscription_plans as { amount: number } | null)?.amount ?? 0), 0) ?? 0)} pending
          </p>
        </div>
        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Cash collected</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {formatINR(collections?.filter((p) => p.payment_method === "cash").reduce((s, p) => s + p.amount, 0) ?? 0)}
          </p>
        </div>
      </div>

      {/* Overdue table */}
      <div>
        <h2 className="text-lg font-semibold mb-3 text-red-600">Overdue subscriptions</h2>
        <div className="rounded-lg border overflow-hidden bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-red-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Member</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Plan</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Due since</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {overdue?.map((sub) => {
                const member = sub.members as { first_name: string; last_name: string | null; member_number: string | null; phone: string } | null;
                const plan = sub.subscription_plans as { name: string } | null;
                return (
                  <tr key={sub.id}>
                    <td className="px-4 py-3 font-medium">
                      {member?.first_name} {member?.last_name}
                      <div className="text-xs text-gray-400">{member?.member_number}</div>
                    </td>
                    <td className="px-4 py-3">{member?.phone}</td>
                    <td className="px-4 py-3">{plan?.name}</td>
                    <td className="px-4 py-3 text-red-600">{sub.next_due_date}</td>
                    <td className="px-4 py-3">
                      <Link href={`/org/${slug}/payments/record?member=${sub.member_id}&subscription=${sub.id}`}
                        className="text-xs text-emerald-600 hover:underline">
                        Record payment
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {(!overdue || overdue.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No overdue subscriptions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

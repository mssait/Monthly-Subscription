import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatINR } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { SUBSCRIPTION_STATUS_CONFIG } from "@/lib/constants/paymentStatus";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Subscriptions" };

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function SubscriptionsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page = "1", status = "" } = await searchParams;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  const pageSize = 25;
  const pageNum = Math.max(1, parseInt(page));
  const from = (pageNum - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("subscriptions")
    .select(
      `*, members(first_name, last_name, member_number), subscription_plans(name, billing_cycle)`,
      { count: "exact" }
    )
    .eq("org_id", org.id)
    .order("next_due_date", { ascending: true, nullsFirst: false })
    .range(from, to);

  if (status) query = query.eq("status", status);

  const { data: subscriptions, count } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-sm text-gray-500">{count ?? 0} subscriptions</p>
        </div>
        <Link
          href={`/org/${slug}/subscriptions/new`}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Assign member
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {["", "active", "overdue", "paused", "cancelled", "expired"].map((s) => (
          <Link
            key={s}
            href={`/org/${slug}/subscriptions${s ? `?status=${s}` : ""}`}
            className={`rounded-full px-3 py-1 text-sm border ${
              status === s
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s ? SUBSCRIPTION_STATUS_CONFIG[s as keyof typeof SUBSCRIPTION_STATUS_CONFIG]?.label : "All"}
          </Link>
        ))}
      </div>

      <div className="rounded-lg border overflow-hidden bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Member</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Plan</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Next due</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subscriptions?.map((sub) => {
              const member = sub.members as { first_name: string; last_name: string | null; member_number: string | null } | null;
              const plan = sub.subscription_plans as { name: string; billing_cycle: string } | null;
              return (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/org/${slug}/members/${sub.member_id}`} className="text-emerald-600 hover:underline font-medium">
                      {member?.first_name} {member?.last_name}
                    </Link>
                    <div className="text-xs text-gray-400">{member?.member_number}</div>
                  </td>
                  <td className="px-4 py-3">{plan?.name}</td>
                  <td className="px-4 py-3 font-medium">{formatINR(sub.amount_override ?? 0)}</td>
                  <td className="px-4 py-3">
                    {sub.next_due_date ? (
                      <span className={sub.status === "overdue" ? "text-red-600 font-medium" : ""}>
                        {formatDate(sub.next_due_date)}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      sub.status === "active" ? "bg-green-100 text-green-700" :
                      sub.status === "overdue" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {SUBSCRIPTION_STATUS_CONFIG[sub.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/org/${slug}/payments/record?member=${sub.member_id}&subscription=${sub.id}`}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      Record payment
                    </Link>
                  </td>
                </tr>
              );
            })}
            {(!subscriptions || subscriptions.length === 0) && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No subscriptions found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

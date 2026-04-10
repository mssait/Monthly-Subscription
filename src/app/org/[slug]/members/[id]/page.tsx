import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatINR } from "@/lib/utils/currency";
import { formatDate as fmtDate } from "@/lib/utils/date";
import { PAYMENT_STATUS_CONFIG, SUBSCRIPTION_STATUS_CONFIG } from "@/lib/constants/paymentStatus";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Member Profile" };

interface PageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function MemberProfilePage({ params }: PageProps) {
  const { slug, id } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!member) notFound();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select(`*, subscription_plans(name, billing_cycle, amount)`)
    .eq("member_id", id)
    .order("created_at", { ascending: false });

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("member_id", id)
    .order("payment_date", { ascending: false })
    .limit(20);

  const totalPaid = payments
    ?.filter((p) => p.payment_status === "paid")
    .reduce((sum, p) => sum + p.amount, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {member.first_name} {member.last_name}
          </h1>
          <p className="text-sm text-gray-500">
            {member.member_number} · {member.phone}
          </p>
        </div>
        <Link
          href={`/org/${slug}/members/${id}/edit`}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Edit
        </Link>
      </div>

      {/* Profile info */}
      <div className="rounded-lg border bg-white p-6 grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-gray-500">Email:</span> {member.email ?? "—"}</div>
        <div><span className="text-gray-500">City:</span> {member.city ?? "—"}</div>
        <div><span className="text-gray-500">Membership type:</span> {member.membership_type ?? "—"}</div>
        <div><span className="text-gray-500">Total paid:</span> <strong>{formatINR(totalPaid)}</strong></div>
        <div><span className="text-gray-500">Status:</span> <span className="capitalize">{member.status}</span></div>
        <div><span className="text-gray-500">Joined:</span> {fmtDate(member.created_at)}</div>
      </div>

      {/* Subscriptions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Subscriptions</h2>
          <Link
            href={`/org/${slug}/subscriptions/new?member=${id}`}
            className="text-sm text-emerald-600 hover:underline"
          >
            + Add subscription
          </Link>
        </div>
        <div className="rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Plan</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Next due</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {subscriptions?.map((sub) => (
                <tr key={sub.id}>
                  <td className="px-4 py-3">
                    <Link href={`/org/${slug}/subscriptions/${sub.id}`} className="text-emerald-600 hover:underline">
                      {(sub.subscription_plans as { name: string } | null)?.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{formatINR(sub.amount_override ?? (sub.subscription_plans as { amount: number } | null)?.amount ?? 0)}</td>
                  <td className="px-4 py-3">{sub.next_due_date ? fmtDate(sub.next_due_date) : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      sub.status === "active" ? "bg-green-100 text-green-700" :
                      sub.status === "overdue" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {SUBSCRIPTION_STATUS_CONFIG[sub.status]?.label}
                    </span>
                  </td>
                </tr>
              ))}
              {(!subscriptions || subscriptions.length === 0) && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No subscriptions</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment history */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Payment history</h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Receipt</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Method</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {payments?.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono text-xs">{p.receipt_number}</td>
                  <td className="px-4 py-3">{fmtDate(p.payment_date)}</td>
                  <td className="px-4 py-3 font-medium">{formatINR(p.amount)}</td>
                  <td className="px-4 py-3 capitalize">{p.payment_method.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.payment_status === "paid" ? "bg-green-100 text-green-700" :
                      p.payment_status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {PAYMENT_STATUS_CONFIG[p.payment_status]?.label}
                    </span>
                  </td>
                </tr>
              ))}
              {(!payments || payments.length === 0) && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No payments</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

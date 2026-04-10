import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatINR } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { PAYMENT_STATUS_CONFIG } from "@/lib/constants/paymentStatus";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payments" };

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}

export default async function PaymentsPage({ params, searchParams }: PageProps) {
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
    .from("payments")
    .select(`*, members(first_name, last_name, member_number)`, { count: "exact" })
    .eq("org_id", org.id)
    .order("payment_date", { ascending: false })
    .range(from, to);

  if (status) query = query.eq("payment_status", status);

  const { data: payments, count } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">{count ?? 0} records</p>
        </div>
        <Link
          href={`/org/${slug}/payments/record`}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Record payment
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {["", "paid", "pending", "failed", "waived"].map((s) => (
          <Link
            key={s}
            href={`/org/${slug}/payments${s ? `?status=${s}` : ""}`}
            className={`rounded-full px-3 py-1 text-sm border ${
              status === s
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s ? PAYMENT_STATUS_CONFIG[s as keyof typeof PAYMENT_STATUS_CONFIG]?.label : "All"}
          </Link>
        ))}
      </div>

      <div className="rounded-lg border overflow-hidden bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Receipt</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Member</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Method</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments?.map((p) => {
              const member = p.members as { first_name: string; last_name: string | null; member_number: string | null } | null;
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.receipt_number}</td>
                  <td className="px-4 py-3">
                    <Link href={`/org/${slug}/members/${p.member_id}`} className="text-emerald-600 hover:underline font-medium">
                      {member?.first_name} {member?.last_name}
                    </Link>
                    <div className="text-xs text-gray-400">{member?.member_number}</div>
                  </td>
                  <td className="px-4 py-3">{formatDate(p.payment_date)}</td>
                  <td className="px-4 py-3 font-semibold">{formatINR(p.amount)}</td>
                  <td className="px-4 py-3 capitalize">{p.payment_method.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.payment_status === "paid" ? "bg-green-100 text-green-700" :
                      p.payment_status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      p.payment_status === "failed" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {PAYMENT_STATUS_CONFIG[p.payment_status]?.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {(!payments || payments.length === 0) && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No payments found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {count && count > pageSize && (
        <div className="flex justify-center gap-2">
          {pageNum > 1 && (
            <Link href={`/org/${slug}/payments?page=${pageNum - 1}${status ? `&status=${status}` : ""}`}
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
              Previous
            </Link>
          )}
          {pageNum * pageSize < count && (
            <Link href={`/org/${slug}/payments?page=${pageNum + 1}${status ? `&status=${status}` : ""}`}
              className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

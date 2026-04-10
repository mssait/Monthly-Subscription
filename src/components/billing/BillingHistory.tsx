import { format } from "date-fns";
import type { PlatformPayment } from "@/lib/supabase/types";

interface Props {
  payments: Array<
    PlatformPayment & { platform_plans: { name: string } | null }
  >;
}

const statusStyles: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-yellow-100 text-yellow-700",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-600",
};

export default function BillingHistory({ payments }: Props) {
  if (payments.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        No billing history yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {["Date", "Plan", "Amount", "Interval", "Status"].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {payments.map((p) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-700">
                {p.paid_at
                  ? format(new Date(p.paid_at), "dd MMM yyyy")
                  : format(new Date(p.created_at), "dd MMM yyyy")}
              </td>
              <td className="px-4 py-3 text-gray-900 font-medium">
                {p.platform_plans?.name ?? "—"}
              </td>
              <td className="px-4 py-3 text-gray-900">
                ₹{p.amount.toLocaleString("en-IN")}
              </td>
              <td className="px-4 py-3 text-gray-600 capitalize">
                {p.billing_interval}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                    statusStyles[p.payment_status] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {p.payment_status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

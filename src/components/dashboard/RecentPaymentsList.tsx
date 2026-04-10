import Link from "next/link";
import { formatINR } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string | null;
  members: { first_name: string; last_name: string | null } | null;
}

interface RecentPaymentsListProps {
  payments: Payment[];
  slug: string;
}

export default function RecentPaymentsList({ payments, slug }: RecentPaymentsListProps) {
  return (
    <div className="rounded-lg border bg-white p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Recent payments</h3>
        <Link href={`/org/${slug}/payments`} className="text-xs text-emerald-600 hover:underline">
          View all
        </Link>
      </div>

      {payments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">No payments yet</p>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {p.members?.first_name} {p.members?.last_name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(p.payment_date)} · {p.payment_method.replace("_", " ")}
                </p>
              </div>
              <span className="text-sm font-semibold text-emerald-600 ml-2 shrink-0">
                {formatINR(p.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

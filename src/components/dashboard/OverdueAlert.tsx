import Link from "next/link";

interface OverdueAlertProps {
  count: number;
  slug: string;
}

export default function OverdueAlert({ count, slug }: OverdueAlertProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-red-500">⚠️</span>
        <p className="text-sm font-medium text-red-700">
          {count} subscription{count > 1 ? "s are" : " is"} overdue
        </p>
      </div>
      <Link
        href={`/org/${slug}/subscriptions?status=overdue`}
        className="text-sm font-medium text-red-600 hover:underline"
      >
        View overdue →
      </Link>
    </div>
  );
}

"use client";

import { differenceInDays, parseISO } from "date-fns";
import type { OrgPlatformSubDetails } from "@/lib/supabase/types";

interface Props {
  sub: OrgPlatformSubDetails | null;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    trial: "bg-blue-100 text-blue-700",
    past_due: "bg-orange-100 text-orange-700",
    cancelled: "bg-gray-100 text-gray-600",
    expired: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        variants[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status === "trial" ? "Free trial" : status.replace("_", " ")}
    </span>
  );
}

export default function BillingStatusCard({ sub }: Props) {
  if (!sub) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
        No active subscription found. Choose a plan below to get started.
      </div>
    );
  }

  const isTrialing = sub.status === "trial";
  const trialDaysLeft = sub.trial_ends_at
    ? differenceInDays(parseISO(sub.trial_ends_at), new Date())
    : null;

  const periodEnd = sub.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Current plan</p>
          <h2 className="text-xl font-bold text-gray-900 mt-0.5">
            {sub.plan_name}
          </h2>
        </div>
        <StatusBadge status={sub.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 text-sm">
        <div>
          <p className="text-gray-500">Billing</p>
          <p className="font-medium text-gray-900 capitalize">
            {sub.billing_interval}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Price</p>
          <p className="font-medium text-gray-900">
            ₹
            {sub.billing_interval === "yearly"
              ? sub.price_yearly.toLocaleString("en-IN")
              : sub.price_monthly.toLocaleString("en-IN")}
            /{sub.billing_interval === "yearly" ? "yr" : "mo"}
          </p>
        </div>
        {periodEnd && (
          <div>
            <p className="text-gray-500">
              {isTrialing ? "Trial ends" : sub.cancel_at_period_end ? "Cancels" : "Renews"}
            </p>
            <p className="font-medium text-gray-900">{periodEnd}</p>
          </div>
        )}
      </div>

      {isTrialing && trialDaysLeft !== null && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            trialDaysLeft <= 3
              ? "bg-red-50 text-red-700"
              : "bg-blue-50 text-blue-700"
          }`}
        >
          {trialDaysLeft > 0
            ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} remaining in your free trial.`
            : "Your free trial has ended. Upgrade to continue using Znifa."}
        </div>
      )}

      {sub.cancel_at_period_end && (
        <div className="rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700">
          Your subscription is set to cancel at the end of the current period.
        </div>
      )}
    </div>
  );
}

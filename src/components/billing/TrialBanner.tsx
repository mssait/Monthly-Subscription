"use client";

import Link from "next/link";
import { differenceInDays, parseISO } from "date-fns";
import type { OrgPlatformSubDetails } from "@/lib/supabase/types";

interface Props {
  sub: OrgPlatformSubDetails | null;
  slug: string;
}

export default function TrialBanner({ sub, slug }: Props) {
  if (!sub) return null;

  const isTrialing = sub.status === "trial";
  const isExpired = sub.status === "expired";
  const isPastDue = sub.status === "past_due";

  if (!isTrialing && !isExpired && !isPastDue) return null;

  const trialDaysLeft =
    isTrialing && sub.trial_ends_at
      ? differenceInDays(parseISO(sub.trial_ends_at), new Date())
      : null;

  let message = "";
  let urgency: "info" | "warn" | "critical" = "info";

  if (isExpired) {
    message = "Your subscription has expired. Upgrade to continue using Znifa.";
    urgency = "critical";
  } else if (isPastDue) {
    message =
      "Your last payment failed. Please update your payment method to keep access.";
    urgency = "critical";
  } else if (isTrialing) {
    if (trialDaysLeft !== null && trialDaysLeft <= 0) {
      message = "Your free trial has ended. Upgrade now to keep access.";
      urgency = "critical";
    } else if (trialDaysLeft !== null && trialDaysLeft <= 3) {
      message = `Only ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your free trial.`;
      urgency = "warn";
    } else {
      message = `Free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} remaining.`;
      urgency = "info";
    }
  }

  if (!message) return null;

  const styles = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    warn: "bg-amber-50 text-amber-800 border-amber-200",
    critical: "bg-red-50 text-red-800 border-red-200",
  };

  return (
    <div
      className={`flex items-center justify-between gap-4 border-b px-4 py-2.5 text-sm ${styles[urgency]}`}
    >
      <span>{message}</span>
      <Link
        href={`/org/${slug}/billing`}
        className="shrink-0 rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
      >
        Upgrade now
      </Link>
    </div>
  );
}

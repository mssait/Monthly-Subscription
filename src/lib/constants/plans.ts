import type { BillingCycle } from "@/lib/supabase/types";

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  half_yearly: "Half Yearly",
  yearly: "Yearly",
  one_time: "One Time",
  custom: "Custom",
};

export const BILLING_CYCLE_OPTIONS = Object.entries(BILLING_CYCLE_LABELS).map(
  ([value, label]) => ({ value: value as BillingCycle, label })
);

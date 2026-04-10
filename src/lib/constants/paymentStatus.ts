import type { PaymentStatus, SubscriptionStatus, PaymentMethod } from "@/lib/supabase/types";

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Pending", variant: "secondary" },
  paid: { label: "Paid", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
  refunded: { label: "Refunded", variant: "outline" },
  waived: { label: "Waived", variant: "outline" },
};

export const SUBSCRIPTION_STATUS_CONFIG: Record<
  SubscriptionStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  active: { label: "Active", variant: "default" },
  overdue: { label: "Overdue", variant: "destructive" },
  paused: { label: "Paused", variant: "secondary" },
  cancelled: { label: "Cancelled", variant: "outline" },
  expired: { label: "Expired", variant: "outline" },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  net_banking: "Net Banking",
  cheque: "Cheque",
  bank_transfer: "Bank Transfer",
  other: "Other",
};

export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_LABELS).map(
  ([value, label]) => ({ value: value as PaymentMethod, label })
);

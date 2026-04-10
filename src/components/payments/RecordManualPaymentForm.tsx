"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { manualPaymentSchema, type ManualPaymentFormValues } from "@/lib/validations/payment";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/constants/paymentStatus";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { toISODate, calculateNextDueDate } from "@/lib/utils/date";

interface Member {
  id: string;
  first_name: string;
  last_name: string | null;
  member_number: string | null;
  phone: string;
}

interface Subscription {
  id: string;
  plan_id: string;
  subscription_plans: { name: string; amount: number; billing_cycle: string; custom_days: number | null } | null;
  amount_override: number | null;
  next_due_date: string | null;
}

interface RecordManualPaymentFormProps {
  orgId: string;
  slug: string;
  members: Member[];
  preselectedMemberId?: string;
  preselectedSubscriptionId?: string;
}

export default function RecordManualPaymentForm({
  orgId,
  slug,
  members,
  preselectedMemberId,
  preselectedSubscriptionId,
}: RecordManualPaymentFormProps) {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ManualPaymentFormValues>({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: {
      member_id: preselectedMemberId ?? "",
      subscription_id: preselectedSubscriptionId ?? "",
      payment_date: toISODate(new Date()),
      payment_method: "cash",
    },
  });

  const selectedMemberId = watch("member_id");
  const selectedSubscriptionId = watch("subscription_id");

  // Load subscriptions when member changes
  useEffect(() => {
    if (!selectedMemberId) {
      setSubscriptions([]);
      return;
    }

    fetch(`/api/subscriptions?member_id=${selectedMemberId}&org_id=${orgId}`)
      .then((r) => r.json())
      .then((data) => {
        setSubscriptions(data ?? []);
        // Auto-fill amount from subscription
        if (preselectedSubscriptionId) {
          const sub = data?.find((s: Subscription) => s.id === preselectedSubscriptionId);
          if (sub) {
            const amount = sub.amount_override ?? sub.subscription_plans?.amount ?? 0;
            setValue("amount", amount);
          }
        }
      })
      .catch(() => setSubscriptions([]));
  }, [selectedMemberId, orgId, preselectedSubscriptionId, setValue]);

  // Auto-fill amount when subscription changes
  useEffect(() => {
    if (!selectedSubscriptionId) return;
    const sub = subscriptions.find((s) => s.id === selectedSubscriptionId);
    if (sub) {
      const amount = sub.amount_override ?? sub.subscription_plans?.amount ?? 0;
      setValue("amount", amount);
    }
  }, [selectedSubscriptionId, subscriptions, setValue]);

  async function onSubmit(values: ManualPaymentFormValues) {
    const sub = subscriptions.find((s) => s.id === values.subscription_id);
    let nextDueDate: string | null = null;
    if (sub?.subscription_plans && sub.next_due_date) {
      const cycle = sub.subscription_plans.billing_cycle as import("@/lib/supabase/types").BillingCycle;
      if (cycle !== "one_time") {
        nextDueDate = toISODate(
          calculateNextDueDate(sub.next_due_date, cycle, sub.subscription_plans.custom_days)
        );
      }
    }

    const res = await fetch("/api/payments/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        org_id: orgId,
        ...values,
        next_due_date: nextDueDate,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Failed to record payment");
      return;
    }

    const payment = await res.json();
    toast.success(`Payment recorded — Receipt: ${payment.receipt_number}`);
    router.push(`/org/${slug}/payments`);
    router.refresh();
  }

  const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border bg-white p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Member *</label>
        <select {...register("member_id")} className={inputClass}>
          <option value="">Select a member</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.first_name} {m.last_name} ({m.member_number}) — {m.phone}
            </option>
          ))}
        </select>
        {errors.member_id && <p className="text-xs text-red-500 mt-1">{errors.member_id.message}</p>}
      </div>

      {subscriptions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subscription (optional)</label>
          <select {...register("subscription_id")} className={inputClass}>
            <option value="">— General payment (no subscription) —</option>
            {subscriptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.subscription_plans?.name} — Due: {s.next_due_date ?? "N/A"}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (INR) *</label>
          <div className="flex rounded-md border border-gray-300 overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
            <span className="bg-gray-50 px-3 py-2 text-sm text-gray-500 border-r">₹</span>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register("amount", { valueAsNumber: true })}
              className="flex-1 px-3 py-2 text-sm outline-none"
            />
          </div>
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment method *</label>
          <select {...register("payment_method")} className={inputClass}>
            {PAYMENT_METHOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment date *</label>
          <input type="date" {...register("payment_date")} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference no. (cheque/transfer)</label>
          <input {...register("reference_number")} className={inputClass} placeholder="CHQ/NEFT/UPI ref" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea {...register("notes")} className={`${inputClass} resize-none`} rows={2} />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSubmitting ? "Recording..." : "Record payment"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

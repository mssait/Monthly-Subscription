"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { calculateNextDueDate, toISODate } from "@/lib/utils/date";
import type { BillingCycle } from "@/lib/supabase/types";

interface Member {
  id: string;
  first_name: string;
  last_name: string | null;
  member_number: string | null;
}

interface Plan {
  id: string;
  name: string;
  amount: number;
  billing_cycle: BillingCycle;
  custom_days: number | null;
}

const subscriptionSchema = z.object({
  member_id: z.string().uuid("Select a member"),
  plan_id: z.string().uuid("Select a plan"),
  start_date: z.string().min(1, "Start date required"),
  amount_override: z.number().positive().optional().nullable(),
  notes: z.string().max(500).optional(),
});

type SubscriptionFormValues = z.infer<typeof subscriptionSchema>;

interface SubscriptionFormProps {
  orgId: string;
  slug: string;
  members: Member[];
  plans: Plan[];
  preselectedMemberId?: string;
}

export default function SubscriptionForm({
  orgId,
  slug,
  members,
  plans,
  preselectedMemberId,
}: SubscriptionFormProps) {
  const router = useRouter();
  const today = toISODate(new Date());

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormValues>({
    defaultValues: {
      member_id: preselectedMemberId ?? "",
      start_date: today,
    },
  });

  const selectedPlanId = watch("plan_id");
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  async function onSubmit(values: SubscriptionFormValues) {
    if (!selectedPlan) return;

    const nextDueDate = selectedPlan.billing_cycle !== "one_time"
      ? toISODate(calculateNextDueDate(values.start_date, selectedPlan.billing_cycle, selectedPlan.custom_days))
      : null;

    const res = await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        org_id: orgId,
        member_id: values.member_id,
        plan_id: values.plan_id,
        start_date: values.start_date,
        next_due_date: nextDueDate,
        amount_override: values.amount_override ?? selectedPlan.amount,
        notes: values.notes,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Failed to create subscription");
      return;
    }

    toast.success("Subscription created");
    router.push(`/org/${slug}/subscriptions`);
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
              {m.first_name} {m.last_name} ({m.member_number})
            </option>
          ))}
        </select>
        {errors.member_id && <p className="text-xs text-red-500 mt-1">{errors.member_id.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Plan *</label>
        <select {...register("plan_id")} className={inputClass}>
          <option value="">Select a plan</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — ₹{p.amount} / {p.billing_cycle}
            </option>
          ))}
        </select>
        {errors.plan_id && <p className="text-xs text-red-500 mt-1">{errors.plan_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start date *</label>
          <input type="date" {...register("start_date")} className={inputClass} />
          {errors.start_date && <p className="text-xs text-red-500 mt-1">{errors.start_date.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom amount (optional)
          </label>
          <div className="flex rounded-md border border-gray-300 overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
            <span className="bg-gray-50 px-3 py-2 text-sm text-gray-500 border-r">₹</span>
            <input
              type="number"
              step="0.01"
              min="0"
              {...register("amount_override", { valueAsNumber: true })}
              className="flex-1 px-3 py-2 text-sm outline-none"
              placeholder={selectedPlan ? String(selectedPlan.amount) : "Plan amount"}
            />
          </div>
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
          {isSubmitting ? "Creating..." : "Create subscription"}
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

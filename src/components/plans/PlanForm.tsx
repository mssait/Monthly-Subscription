"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { planSchema, type PlanFormValues } from "@/lib/validations/plan";
import { BILLING_CYCLE_OPTIONS } from "@/lib/constants/plans";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { SubscriptionPlan } from "@/lib/supabase/types";

interface PlanFormProps {
  orgId: string;
  slug: string;
  plan?: SubscriptionPlan;
}

export default function PlanForm({ orgId, slug, plan }: PlanFormProps) {
  const router = useRouter();
  const isEdit = !!plan;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: plan
      ? {
          name: plan.name,
          description: plan.description ?? "",
          amount: plan.amount,
          billing_cycle: plan.billing_cycle,
          custom_days: plan.custom_days ?? undefined,
          is_active: plan.is_active,
          allows_partial: plan.allows_partial,
        }
      : { is_active: true, allows_partial: false, billing_cycle: "monthly" },
  });

  const billingCycle = watch("billing_cycle");

  async function onSubmit(values: PlanFormValues) {
    const url = isEdit ? `/api/plans/${plan.id}` : "/api/plans";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, org_id: orgId }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Failed to save plan");
      return;
    }

    toast.success(isEdit ? "Plan updated" : "Plan created");
    router.push(`/org/${slug}/plans`);
    router.refresh();
  }

  const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border bg-white p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Plan name *</label>
        <input {...register("name")} className={inputClass} placeholder="e.g. Monthly Sadaqah" />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea {...register("description")} className={`${inputClass} resize-none`} rows={2} />
      </div>

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
              placeholder="500"
            />
          </div>
          {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Billing cycle *</label>
          <select {...register("billing_cycle")} className={inputClass}>
            {BILLING_CYCLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {billingCycle === "custom" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Every N days *</label>
          <input
            type="number"
            min="1"
            {...register("custom_days", { valueAsNumber: true })}
            className={inputClass}
            placeholder="e.g. 45"
          />
          {errors.custom_days && <p className="text-xs text-red-500 mt-1">{errors.custom_days.message}</p>}
        </div>
      )}

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("is_active")} className="rounded border-gray-300 text-emerald-600" />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("allows_partial")} className="rounded border-gray-300 text-emerald-600" />
          Allow partial payments
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Create plan"}
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

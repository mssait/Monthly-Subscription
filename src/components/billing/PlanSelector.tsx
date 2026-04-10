"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { PlatformPlan, PlatformInterval, OrgPlatformSubDetails } from "@/lib/supabase/types";

interface Props {
  plans: PlatformPlan[];
  currentSub: OrgPlatformSubDetails | null;
  orgId: string;
}

declare const Cashfree: {
  init: (opts: { mode: string }) => void;
  checkout: (opts: { paymentSessionId: string; returnUrl?: string }) => Promise<void>;
};

export default function PlanSelector({ plans, currentSub, orgId }: Props) {
  const [interval, setInterval] = useState<PlatformInterval>("monthly");
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  async function handleSubscribe(plan: PlatformPlan) {
    setLoadingPlanId(plan.id);
    try {
      const res = await fetch("/api/platform/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          plan_id: plan.id,
          billing_interval: interval,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to create subscription order");
        return;
      }

      const { payment_session_id } = await res.json();

      // Load Cashfree JS SDK dynamically
      if (typeof window !== "undefined" && !document.getElementById("cashfree-sdk")) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.id = "cashfree-sdk";
          script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
          document.head.appendChild(script);
        });
      }

      // @ts-expect-error – Cashfree global loaded dynamically
      const cf = typeof Cashfree !== "undefined" ? Cashfree : (window as unknown as { Cashfree: typeof Cashfree }).Cashfree;
      cf.init({
        mode:
          process.env.NEXT_PUBLIC_CASHFREE_ENV === "production"
            ? "production"
            : "sandbox",
      });

      await cf.checkout({ paymentSessionId: payment_session_id });
    } catch (err) {
      console.error(err);
      toast.error("Payment failed. Please try again.");
    } finally {
      setLoadingPlanId(null);
    }
  }

  const currentPlanSlug = currentSub?.plan_slug;
  const isActive = currentSub?.status === "active";

  return (
    <div className="space-y-6">
      {/* Billing interval toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Billing:</span>
        <div className="flex rounded-lg border border-gray-200 bg-gray-100 p-0.5">
          {(["monthly", "yearly"] as PlatformInterval[]).map((iv) => (
            <button
              key={iv}
              onClick={() => setInterval(iv)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                interval === iv
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {iv === "monthly" ? "Monthly" : "Yearly (save ~17%)"}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {plans.map((plan) => {
          const features = Array.isArray(plan.features)
            ? (plan.features as string[])
            : [];
          const price =
            interval === "yearly" ? plan.price_yearly : plan.price_monthly;
          const isCurrentPlan = plan.slug === currentPlanSlug;
          const isPopular = plan.slug === "growth";
          const isLoading = loadingPlanId === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative rounded-xl border bg-white p-6 flex flex-col shadow-sm ${
                isPopular
                  ? "border-emerald-500 ring-2 ring-emerald-500"
                  : "border-gray-200"
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                </div>
              )}

              <h3 className="font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-1 text-xs text-gray-500 mb-3">{plan.description}</p>

              <div className="flex items-end gap-1 mb-4">
                <span className="text-2xl font-extrabold text-gray-900">
                  ₹{price.toLocaleString("en-IN")}
                </span>
                <span className="mb-0.5 text-xs text-gray-500">
                  /{interval === "yearly" ? "yr" : "mo"}
                </span>
              </div>

              <ul className="space-y-2 flex-1 mb-5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-gray-700">
                    <svg
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              {isCurrentPlan && isActive ? (
                <div className="rounded-lg bg-emerald-50 py-2 text-center text-xs font-semibold text-emerald-700">
                  Current plan
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isLoading}
                  className={`rounded-lg py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                    isPopular
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  {isLoading
                    ? "Processing..."
                    : isCurrentPlan
                    ? "Renew plan"
                    : currentSub && currentSub.plan_slug
                    ? "Switch to this plan"
                    : "Subscribe"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

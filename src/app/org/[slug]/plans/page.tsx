import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatINR } from "@/lib/utils/currency";
import { BILLING_CYCLE_LABELS } from "@/lib/constants/plans";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Subscription Plans" };

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PlansPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-sm text-gray-500">{plans?.length ?? 0} plans</p>
        </div>
        <Link
          href={`/org/${slug}/plans/new`}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + New plan
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans?.map((plan) => (
          <Link
            key={plan.id}
            href={`/org/${slug}/plans/${plan.id}`}
            className="rounded-lg border bg-white p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{plan.name}</h3>
              <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                plan.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}>
                {plan.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            {plan.description && (
              <p className="text-sm text-gray-500 mb-3">{plan.description}</p>
            )}
            <div className="text-2xl font-bold text-emerald-600 mb-1">
              {formatINR(plan.amount)}
            </div>
            <div className="text-sm text-gray-500">
              {BILLING_CYCLE_LABELS[plan.billing_cycle]}
              {plan.billing_cycle === "custom" && plan.custom_days
                ? ` (every ${plan.custom_days} days)`
                : ""}
            </div>
          </Link>
        ))}

        {(!plans || plans.length === 0) && (
          <div className="col-span-3 rounded-lg border border-dashed bg-gray-50 p-12 text-center">
            <p className="text-gray-500 mb-4">No plans yet</p>
            <Link
              href={`/org/${slug}/plans/new`}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Create your first plan
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

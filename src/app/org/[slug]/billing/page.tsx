import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BillingStatusCard from "@/components/billing/BillingStatusCard";
import PlanSelector from "@/components/billing/PlanSelector";
import BillingHistory from "@/components/billing/BillingHistory";
import type { Metadata } from "next";
import type {
  OrgPlatformSubDetails,
  PlatformPlan,
  PlatformPayment,
} from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Billing & Subscription" };

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BillingPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirectTo=/org/${slug}/billing`);

  // Load org
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  // Check org_admin role
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "org_admin") {
    redirect(`/org/${slug}/dashboard`);
  }

  // Load current platform subscription via RPC
  const { data: rawSub } = await supabase.rpc("get_org_platform_sub", {
    p_org_id: org.id,
  });

  const currentSub = (rawSub as OrgPlatformSubDetails | null) ?? null;

  // Load all active platform plans
  const { data: plans } = await supabase
    .from("platform_plans")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  // Load billing history
  const { data: history } = await supabase
    .from("platform_payments")
    .select("*, platform_plans(name)")
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Billing &amp; Subscription
        </h1>
        <p className="text-sm text-gray-500">
          Manage your Znifa plan and payment history
        </p>
      </div>

      {/* Current subscription status */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          Current plan
        </h2>
        <BillingStatusCard sub={currentSub} />
      </section>

      {/* Plan selector */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          {currentSub?.status === "active"
            ? "Change or renew plan"
            : "Choose a plan"}
        </h2>
        <PlanSelector
          plans={(plans as PlatformPlan[]) ?? []}
          currentSub={currentSub}
          orgId={org.id}
        />
      </section>

      {/* Billing history */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">
          Billing history
        </h2>
        <BillingHistory
          payments={
            (history as Array<
              PlatformPayment & { platform_plans: { name: string } | null }
            >) ?? []
          }
        />
      </section>
    </div>
  );
}

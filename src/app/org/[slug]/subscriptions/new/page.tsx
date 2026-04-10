import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import SubscriptionForm from "@/components/subscriptions/SubscriptionForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Subscription" };

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ member?: string }>;
}

export default async function NewSubscriptionPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { member: memberPreset } = await searchParams;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  const [{ data: members }, { data: plans }] = await Promise.all([
    supabase
      .from("members")
      .select("id, first_name, last_name, member_number")
      .eq("org_id", org.id)
      .eq("status", "active")
      .order("first_name"),
    supabase
      .from("subscription_plans")
      .select("id, name, amount, billing_cycle, custom_days")
      .eq("org_id", org.id)
      .eq("is_active", true)
      .order("name"),
  ]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Assign subscription</h1>
        <p className="text-sm text-gray-500">Enroll a member in a subscription plan</p>
      </div>
      <SubscriptionForm
        orgId={org.id}
        slug={slug}
        members={members ?? []}
        plans={plans ?? []}
        preselectedMemberId={memberPreset}
      />
    </div>
  );
}

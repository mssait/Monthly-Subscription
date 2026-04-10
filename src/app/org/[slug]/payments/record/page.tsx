import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import RecordManualPaymentForm from "@/components/payments/RecordManualPaymentForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Record Payment" };

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ member?: string; subscription?: string }>;
}

export default async function RecordPaymentPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { member: memberPreset, subscription: subscriptionPreset } = await searchParams;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  // Load active members for the select dropdown
  const { data: members } = await supabase
    .from("members")
    .select("id, first_name, last_name, member_number, phone")
    .eq("org_id", org.id)
    .eq("status", "active")
    .order("first_name");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Record payment</h1>
        <p className="text-sm text-gray-500">Record a cash or manual payment</p>
      </div>
      <RecordManualPaymentForm
        orgId={org.id}
        slug={slug}
        members={members ?? []}
        preselectedMemberId={memberPreset}
        preselectedSubscriptionId={subscriptionPreset}
      />
    </div>
  );
}

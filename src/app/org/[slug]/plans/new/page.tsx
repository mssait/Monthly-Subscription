import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PlanForm from "@/components/plans/PlanForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Plan" };

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewPlanPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create plan</h1>
        <p className="text-sm text-gray-500">New subscription plan for {org.name}</p>
      </div>
      <PlanForm orgId={org.id} slug={slug} />
    </div>
  );
}

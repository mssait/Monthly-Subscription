import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import MemberForm from "@/components/members/MemberForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Add Member" };

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewMemberPage({ params }: PageProps) {
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
        <h1 className="text-2xl font-bold text-gray-900">Add member</h1>
        <p className="text-sm text-gray-500">Register a new member for {org.name}</p>
      </div>
      <MemberForm orgId={org.id} slug={slug} />
    </div>
  );
}

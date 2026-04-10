import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import OrgSettingsForm from "@/components/settings/OrgSettingsForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organisation settings</h1>
        <p className="text-sm text-gray-500">Update your organisation profile</p>
      </div>
      <OrgSettingsForm org={org} />
    </div>
  );
}

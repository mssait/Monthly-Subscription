import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import TrialBanner from "@/components/billing/TrialBanner";
import type { OrgPlatformSubDetails } from "@/lib/supabase/types";

interface OrgLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=/org/${slug}`);
  }

  // Load the org
  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  // Check user membership
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    redirect("/");
  }

  // Load platform subscription status
  const { data: rawSub } = await supabase.rpc("get_org_platform_sub", {
    p_org_id: org.id,
  });

  const platformSub = (rawSub as OrgPlatformSubDetails | null) ?? null;

  return (
    <AppShell
      org={org}
      userRole={membership.role}
      userId={user.id}
      platformSub={platformSub}
    >
      <TrialBanner sub={platformSub} slug={slug} />
      {children}
    </AppShell>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LandingPage from "@/components/marketing/LandingPage";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is logged in, redirect to their org dashboard
  if (user) {
    const { data: membership } = await supabase
      .from("org_members")
      .select("organizations(slug)")
      .eq("user_id", user.id)
      .order("joined_at", { ascending: true })
      .limit(1)
      .single();

    const slug =
      (membership?.organizations as { slug: string } | null)?.slug ?? null;

    if (slug) {
      redirect(`/org/${slug}/dashboard`);
    } else {
      redirect("/register");
    }
  }

  // Not logged in — show marketing landing page
  return <LandingPage />;
}

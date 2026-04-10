"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loadPendingOrg, clearPendingOrg } from "@/app/(auth)/register/page";
import { toast } from "sonner";

/**
 * Post-confirmation landing page.
 * Supabase email confirmation → /auth/confirm (server, sets cookie) → here.
 *
 * Responsibilities:
 * 1. Verify the user has an active session (cookie was set by /auth/confirm).
 * 2. If a pending org is stored in localStorage, create it via /api/orgs/create.
 * 3. Redirect to the org dashboard (or /register if something is missing).
 */
export default function CompletePage() {
  const router = useRouter();
  const [status, setStatus] = useState("Finishing setup…");

  useEffect(() => {
    async function finish() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Session not found — ask user to log in again
        toast.error("Session expired. Please sign in.");
        router.replace("/login");
        return;
      }

      const pending = loadPendingOrg();

      if (pending) {
        setStatus("Creating your organisation…");
        const response = await fetch("/api/orgs/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: pending.name,
            slug: pending.slug,
            org_type: pending.org_type,
            user_id: user.id,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          toast.error(err.error ?? "Failed to create organisation");
          // Don't clear pending so user can retry from the login page
          router.replace("/login");
          return;
        }

        clearPendingOrg();
        toast.success("Organisation created! Welcome to Znifa.");
        router.replace(`/org/${pending.slug}/dashboard`);
        return;
      }

      // No pending org — find the user's existing org and go to its dashboard
      setStatus("Redirecting…");
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
        router.replace(`/org/${slug}/dashboard`);
      } else {
        toast.info("No organisation found. Please create one.");
        router.replace("/register");
      }
    }

    finish();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent mx-auto" />
        <p className="text-sm text-gray-600">{status}</p>
      </div>
    </div>
  );
}

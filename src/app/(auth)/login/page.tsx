"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { loadPendingOrg, clearPendingOrg } from "@/app/(auth)/register/page";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");
  const confirmError = searchParams.get("error") === "confirmation_failed";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // If a pending org exists in localStorage (user confirmed email and came
    // back to log in), create the org now before redirecting.
    const pending = loadPendingOrg();
    if (pending) {
      const response = await fetch("/api/orgs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pending.name,
          slug: pending.slug,
          org_type: pending.org_type,
          user_id: data.user.id,
        }),
      });

      if (response.ok) {
        clearPendingOrg();
        toast.success("Organisation created! Welcome to Znifa.");
        router.push(`/org/${pending.slug}/dashboard`);
        router.refresh();
        return;
      } else {
        const err = await response.json();
        toast.error(err.error ?? "Failed to create organisation");
        setLoading(false);
        return;
      }
    }

    // If there's an explicit redirectTo (e.g. from middleware), use it
    if (redirectTo && redirectTo !== "/") {
      router.push(redirectTo);
      router.refresh();
      return;
    }

    // Otherwise, find the user's org and redirect to dashboard
    const { data: membership } = await supabase
      .from("org_members")
      .select("organizations(slug)")
      .eq("user_id", data.user.id)
      .order("joined_at", { ascending: true })
      .limit(1)
      .single();

    const slug =
      (membership?.organizations as { slug: string } | null)?.slug ?? null;

    if (slug) {
      router.push(`/org/${slug}/dashboard`);
    } else {
      // User has no org yet — send them to register
      toast.info("No organisation found. Please create one.");
      router.push("/register");
    }

    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h1>
        <p className="text-sm text-gray-500 mb-6">
          Welcome back. Sign in to your Znifa account.
        </p>

        {confirmError && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            Email confirmation failed or the link has expired. Please request a
            new confirmation email by registering again.
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-emerald-600 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-emerald-600 hover:underline">
            Register your organisation
          </Link>
        </p>
      </div>
    </div>
  );
}

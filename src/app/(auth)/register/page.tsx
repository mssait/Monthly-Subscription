"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils/slug";
import { ORG_TYPE_OPTIONS } from "@/lib/constants/orgTypes";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"account" | "org">("account");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [orgType, setOrgType] = useState("masjid");

  function handleOrgNameChange(name: string) {
    setOrgName(name);
    setOrgSlug(generateSlug(name));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    // 1. Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    // If email confirmation is enabled, user won't have a session yet.
    // Try signing in immediately to get a session.
    let userId = authData.user?.id;

    if (!authData.session) {
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError || !signInData.user) {
        // Email confirmation is required — tell the user
        toast.info(
          "Account created! Please check your email to confirm your account, then sign in."
        );
        router.push("/login");
        return;
      }
      userId = signInData.user.id;
    }

    if (!userId) {
      toast.error("Sign up failed — please try again");
      setLoading(false);
      return;
    }

    // 2. Create organisation (via API route to use service role)
    const response = await fetch("/api/orgs/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: orgName,
        slug: orgSlug,
        org_type: orgType,
        user_id: userId,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      toast.error(err.error ?? "Failed to create organisation");
      setLoading(false);
      return;
    }

    toast.success("Organisation created! Redirecting...");
    router.push(`/org/${orgSlug}/dashboard`);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Register your organisation
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Create your Znifa account and set up your holy place in minutes.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="admin@yourmasjid.org"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Min 8 characters"
            />
          </div>

          <hr className="border-gray-100" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organisation type
            </label>
            <select
              value={orgType}
              onChange={(e) => setOrgType(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {ORG_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organisation name
            </label>
            <input
              type="text"
              required
              value={orgName}
              onChange={(e) => handleOrgNameChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="e.g. Al Noor Masjid"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL slug
            </label>
            <div className="flex rounded-md border border-gray-300 overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
              <span className="bg-gray-50 px-3 py-2 text-sm text-gray-500 border-r">
                znifa.in/org/
              </span>
              <input
                type="text"
                required
                value={orgSlug}
                onChange={(e) => setOrgSlug(e.target.value)}
                className="flex-1 px-3 py-2 text-sm outline-none"
                placeholder="al-noor-masjid"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create organisation"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-emerald-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

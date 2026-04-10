"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-xl border bg-white p-8 shadow-sm text-center">
          <div className="text-4xl mb-4">📧</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Check your email</h1>
          <p className="text-sm text-gray-600">
            We sent a password reset link to <strong>{email}</strong>
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm text-emerald-600 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset password</h1>
        <p className="text-sm text-gray-500 mb-6">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          <Link href="/login" className="text-emerald-600 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}

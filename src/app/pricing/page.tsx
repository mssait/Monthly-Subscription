import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { PlatformPlan } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Pricing" };

// Static fallback plans rendered if Supabase is not reachable at build time
const FALLBACK_PLANS: PlatformPlan[] = [
  {
    id: "starter",
    name: "Starter",
    slug: "starter",
    description: "Perfect for small holy places just getting started",
    price_monthly: 499,
    price_yearly: 4999,
    max_members: 100,
    max_staff: 2,
    features: [
      "Up to 100 members",
      "2 staff accounts",
      "Subscription plans",
      "Manual payments",
      "Basic reports",
      "Email support",
    ],
    is_active: true,
    sort_order: 1,
    created_at: "",
  },
  {
    id: "growth",
    name: "Growth",
    slug: "growth",
    description: "For growing communities with online payment needs",
    price_monthly: 999,
    price_yearly: 9999,
    max_members: 500,
    max_staff: 5,
    features: [
      "Up to 500 members",
      "5 staff accounts",
      "Subscription plans",
      "Online payments via Cashfree",
      "Advanced reports & CSV export",
      "Priority support",
    ],
    is_active: true,
    sort_order: 2,
    created_at: "",
  },
  {
    id: "pro",
    name: "Pro",
    slug: "pro",
    description: "Unlimited everything for large organisations",
    price_monthly: 1999,
    price_yearly: 19999,
    max_members: null,
    max_staff: null,
    features: [
      "Unlimited members",
      "Unlimited staff",
      "All payment methods",
      "Custom billing cycles",
      "Full analytics",
      "Dedicated support",
      "API access",
    ],
    is_active: true,
    sort_order: 3,
    created_at: "",
  },
];

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function PricingPage() {
  let plans: PlatformPlan[] = FALLBACK_PLANS;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("platform_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (data && data.length > 0) plans = data;
  } catch {
    // Use fallback plans if DB not available
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🕌</span>
            <span className="text-xl font-bold text-emerald-700">Znifa</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-xl mx-auto">
          Start with a 14-day free trial. No credit card required.
          Upgrade anytime to unlock more members and features.
        </p>
      </section>

      {/* Plan cards */}
      <section className="container pb-24">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan, i) => {
            const isPopular = plan.slug === "growth";
            const features = Array.isArray(plan.features)
              ? (plan.features as string[])
              : [];
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border bg-white p-8 shadow-sm flex flex-col ${
                  isPopular
                    ? "border-emerald-500 ring-2 ring-emerald-500 shadow-emerald-100 shadow-lg"
                    : "border-gray-200"
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-gray-900">
                      {formatINR(plan.price_monthly)}
                    </span>
                    <span className="mb-1 text-sm text-gray-500">/month</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatINR(plan.price_yearly)}/year (save{" "}
                    {Math.round(
                      100 - (plan.price_yearly / (plan.price_monthly * 12)) * 100
                    )}
                    %)
                  </p>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`block rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                    isPopular
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : "border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                  }`}
                >
                  Start free trial
                </Link>
              </div>
            );
          })}
        </div>

        {/* FAQ-style notes */}
        <div className="mt-16 max-w-2xl mx-auto text-center space-y-4 text-sm text-gray-500">
          <p>
            All plans start with a <strong>14-day free trial</strong> on the
            Starter plan. No card required.
          </p>
          <p>
            Payments are processed securely via Cashfree. Prices are in Indian
            Rupees (INR) and inclusive of applicable taxes.
          </p>
          <p>
            Need a custom plan for a very large organisation?{" "}
            <a href="mailto:support@znifa.in" className="text-emerald-600 hover:underline">
              Contact us
            </a>
            .
          </p>
        </div>
      </section>

      <footer className="border-t bg-white py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Znifa. Built with care for Indian communities.
      </footer>
    </main>
  );
}

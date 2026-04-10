import Link from "next/link";

const PLANS = [
  {
    name: "Starter",
    price: 499,
    desc: "Small holy places just getting started",
    features: ["100 members", "2 staff", "Manual payments", "Basic reports"],
    cta: "Start free trial",
    slug: "starter",
    popular: false,
  },
  {
    name: "Growth",
    price: 999,
    desc: "Growing communities with online payments",
    features: [
      "500 members",
      "5 staff",
      "Online payments via Cashfree",
      "Advanced reports & CSV",
    ],
    cta: "Start free trial",
    slug: "growth",
    popular: true,
  },
  {
    name: "Pro",
    price: 1999,
    desc: "Unlimited everything for large organisations",
    features: [
      "Unlimited members",
      "Unlimited staff",
      "All payment methods",
      "Dedicated support",
    ],
    cta: "Start free trial",
    slug: "pro",
    popular: false,
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🕌</span>
            <span className="text-xl font-bold text-emerald-700">Znifa</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900">Features</a>
            <Link href="/pricing" className="hover:text-gray-900">Pricing</Link>
          </nav>
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
      <section className="container py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Subscription management
          <br />
          <span className="text-emerald-600">for holy places</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Collect dues, track donations, manage members, and generate reports —
          all in one place. Built for masjids, temples, churches, and
          gurudwaras across India.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/register"
            className="rounded-md bg-emerald-600 px-8 py-3 text-base font-medium text-white hover:bg-emerald-700"
          >
            Start free 14-day trial
          </Link>
          <Link
            href="/pricing"
            className="rounded-md border border-gray-300 px-8 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            See pricing
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-400">No credit card required.</p>
      </section>

      {/* Features */}
      <section id="features" className="container py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Everything you need
        </h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: "👥",
              title: "Member Management",
              desc: "Register and manage your community members with full profiles and history.",
            },
            {
              icon: "💳",
              title: "Subscription Plans",
              desc: "Create monthly, yearly, or custom collection plans in Indian Rupees.",
            },
            {
              icon: "📱",
              title: "Online Payments",
              desc: "Accept UPI, cards, and net banking via Cashfree. Cash payments too.",
            },
            {
              icon: "📊",
              title: "Reports & Export",
              desc: "Visual dashboards, collection reports, and CSV export.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported org types */}
      <section className="bg-emerald-50 py-16">
        <div className="container text-center">
          <p className="text-sm font-medium text-emerald-700 uppercase tracking-wide mb-4">
            Supporting all holy places
          </p>
          <div className="flex justify-center gap-12 flex-wrap">
            {[
              { emoji: "🕌", label: "Masjid" },
              { emoji: "🛕", label: "Temple" },
              { emoji: "⛪", label: "Church" },
              { emoji: "🏛️", label: "Gurudwara" },
            ].map((t) => (
              <div key={t.label} className="text-center">
                <div className="text-4xl mb-1">{t.emoji}</div>
                <div className="text-sm font-medium text-gray-700">
                  {t.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing section */}
      <section id="pricing" className="container py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-gray-500">
            14-day free trial on all plans. No card required.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.slug}
              className={`relative rounded-2xl border bg-white p-8 shadow-sm flex flex-col ${
                plan.popular
                  ? "border-emerald-500 ring-2 ring-emerald-500 shadow-emerald-100 shadow-lg"
                  : "border-gray-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                    Most popular
                  </span>
                </div>
              )}
              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <p className="mt-1 text-sm text-gray-500 mb-4">{plan.desc}</p>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-extrabold text-gray-900">
                  ₹{plan.price}
                </span>
                <span className="mb-1 text-sm text-gray-500">/month</span>
              </div>
              <ul className="space-y-2 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <svg
                      className="h-4 w-4 shrink-0 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                  plan.popular
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "border border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link href="/pricing" className="text-sm text-emerald-600 hover:underline">
            View full pricing details →
          </Link>
        </div>
      </section>

      <footer className="border-t bg-white py-8 text-center text-sm text-gray-500">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} Znifa. Built with care for Indian communities.</span>
          <div className="flex gap-4">
            <Link href="/pricing" className="hover:text-gray-700">Pricing</Link>
            <a href="mailto:support@znifa.in" className="hover:text-gray-700">Support</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

import Link from "next/link";

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
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/register"
            className="rounded-md bg-emerald-600 px-8 py-3 text-base font-medium text-white hover:bg-emerald-700"
          >
            Start free trial
          </Link>
          <Link
            href="#features"
            className="rounded-md border border-gray-300 px-8 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            Learn more
          </Link>
        </div>
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

      <footer className="border-t bg-white py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Znifa. Built with care for Indian
        communities.
      </footer>
    </main>
  );
}

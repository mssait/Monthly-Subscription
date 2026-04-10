import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import StatsCard from "@/components/dashboard/StatsCard";
import CollectionChart from "@/components/dashboard/CollectionChart";
import RecentPaymentsList from "@/components/dashboard/RecentPaymentsList";
import OverdueAlert from "@/components/dashboard/OverdueAlert";
import { formatINR } from "@/lib/utils/currency";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  const { data: stats } = await supabase.rpc("get_org_dashboard_stats", {
    p_org_id: org.id,
  });

  const { data: recentPayments } = await supabase
    .from("payments")
    .select(`
      id, amount, payment_date, payment_method, payment_status, receipt_number,
      members(first_name, last_name)
    `)
    .eq("org_id", org.id)
    .eq("payment_status", "paid")
    .order("payment_date", { ascending: false })
    .limit(5);

  const s = stats as {
    total_members: number;
    active_subscriptions: number;
    overdue_subscriptions: number;
    collection_this_month: number;
    collection_last_month: number;
    monthly_trend: Array<{ month: string; total: number }>;
  } | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
        <p className="text-sm text-gray-500">Dashboard overview</p>
      </div>

      {s && s.overdue_subscriptions > 0 && (
        <OverdueAlert count={s.overdue_subscriptions} slug={slug} />
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Collection this month"
          value={formatINR(s?.collection_this_month ?? 0)}
          subtitle={`Last month: ${formatINR(s?.collection_last_month ?? 0)}`}
          icon="💰"
        />
        <StatsCard
          title="Active members"
          value={String(s?.total_members ?? 0)}
          icon="👥"
        />
        <StatsCard
          title="Active subscriptions"
          value={String(s?.active_subscriptions ?? 0)}
          icon="📋"
        />
        <StatsCard
          title="Overdue"
          value={String(s?.overdue_subscriptions ?? 0)}
          icon="⚠️"
          variant={s && s.overdue_subscriptions > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CollectionChart data={s?.monthly_trend ?? []} />
        </div>
        <div>
          <RecentPaymentsList
            payments={recentPayments ?? []}
            slug={slug}
          />
        </div>
      </div>
    </div>
  );
}

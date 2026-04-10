"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import type { Organization, UserRole, OrgPlatformSubDetails } from "@/lib/supabase/types";
import { ORG_TYPE_CONFIG } from "@/lib/constants/orgTypes";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles?: UserRole[];
}

function getNavItems(slug: string): NavItem[] {
  return [
    { label: "Dashboard", href: `/org/${slug}/dashboard`, icon: "📊" },
    { label: "Members", href: `/org/${slug}/members`, icon: "👥" },
    { label: "Subscriptions", href: `/org/${slug}/subscriptions`, icon: "📋" },
    { label: "Payments", href: `/org/${slug}/payments`, icon: "💳" },
    { label: "Plans", href: `/org/${slug}/plans`, icon: "📝" },
    { label: "Reports", href: `/org/${slug}/reports`, icon: "📈" },
    {
      label: "Settings",
      href: `/org/${slug}/settings`,
      icon: "⚙️",
      roles: ["org_admin"],
    },
    {
      label: "Billing",
      href: `/org/${slug}/billing`,
      icon: "🏷️",
      roles: ["org_admin"],
    },
  ];
}

interface SidebarProps {
  org: Organization;
  userRole: UserRole;
  platformSub: OrgPlatformSubDetails | null;
  open: boolean;
  onClose: () => void;
}

function PlanBadge({ sub }: { sub: OrgPlatformSubDetails | null }) {
  if (!sub) return null;

  const styles: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    trial: "bg-blue-100 text-blue-700",
    past_due: "bg-orange-100 text-orange-700",
    cancelled: "bg-gray-100 text-gray-500",
    expired: "bg-red-100 text-red-700",
  };

  const labels: Record<string, string> = {
    active: sub.plan_name,
    trial: `Trial · ${sub.plan_name}`,
    past_due: "Past due",
    cancelled: "Cancelled",
    expired: "Expired",
  };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
        styles[sub.status] ?? styles.cancelled
      }`}
    >
      {labels[sub.status] ?? sub.plan_name}
    </span>
  );
}

export default function Sidebar({
  org,
  userRole,
  platformSub,
  open,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const navItems = getNavItems(org.slug).filter(
    (item) => !item.roles || item.roles.includes(userRole)
  );
  const orgConfig = ORG_TYPE_CONFIG[org.org_type];

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo / Org name */}
      <div className="flex items-center gap-3 px-4 py-5 border-b">
        <span className="text-2xl">{orgConfig.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{org.name}</p>
          <p className={`text-xs ${orgConfig.color}`}>{orgConfig.label}</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer — plan badge */}
      <div className="border-t px-4 py-3 space-y-1.5">
        <PlanBadge sub={platformSub} />
        <p className="text-xs text-gray-400">
          Powered by{" "}
          <span className="font-semibold text-emerald-600">Znifa</span>
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r bg-white">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={onClose}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r bg-white lg:hidden">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}

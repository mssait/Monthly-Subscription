"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import type { Organization } from "@/lib/supabase/types";
import type { UserRole } from "@/lib/supabase/types";

interface AppShellProps {
  org: Organization;
  userRole: UserRole;
  userId: string;
  children: React.ReactNode;
}

export default function AppShell({ org, userRole, userId, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        org={org}
        userRole={userRole}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area (offset for sidebar on desktop) */}
      <div className="lg:pl-64">
        <TopBar
          orgName={org.name}
          slug={org.slug}
          userId={userId}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

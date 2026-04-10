"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface TopBarProps {
  orgName: string;
  slug: string;
  userId: string;
  onMenuClick: () => void;
}

export default function TopBar({ orgName, slug, userId, onMenuClick }: TopBarProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Sign out failed");
    } else {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-3 lg:px-6">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <span className="lg:hidden text-sm font-semibold text-gray-900">{orgName}</span>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={handleSignOut}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

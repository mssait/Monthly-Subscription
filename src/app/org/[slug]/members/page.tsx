import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import MemberTable from "@/components/members/MemberTable";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Members" };

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

export default async function MembersPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page = "1", search = "", status = "" } = await searchParams;
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!org) notFound();

  const pageSize = 20;
  const pageNum = Math.max(1, parseInt(page));
  const from = (pageNum - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("members")
    .select("*", { count: "exact" })
    .eq("org_id", org.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`
    );
  }
  if (status) {
    query = query.eq("status", status as "active" | "inactive" | "deceased");
  }

  const { data: members, count } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-sm text-gray-500">{count ?? 0} total members</p>
        </div>
        <Link
          href={`/org/${slug}/members/new`}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Add member
        </Link>
      </div>

      <MemberTable
        members={members ?? []}
        totalCount={count ?? 0}
        page={pageNum}
        pageSize={pageSize}
        slug={slug}
        search={search}
        status={status}
      />
    </div>
  );
}

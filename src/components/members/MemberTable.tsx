"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useTransition } from "react";
import type { Member } from "@/lib/supabase/types";
import { formatDate } from "@/lib/utils/date";

interface MemberTableProps {
  members: Member[];
  totalCount: number;
  page: number;
  pageSize: number;
  slug: string;
  search: string;
  status: string;
}

export default function MemberTable({
  members,
  totalCount,
  page,
  pageSize,
  slug,
  search,
  status,
}: MemberTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(search);

  function updateSearch(value: string) {
    setSearchValue(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value) params.set("search", value);
      if (status) params.set("status", status);
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="space-y-4">
      {/* Search and filter */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="search"
          value={searchValue}
          onChange={(e) => updateSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="rounded-md border border-gray-300 px-3 py-2 text-sm w-64 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <select
          value={status}
          onChange={(e) => {
            const params = new URLSearchParams();
            if (searchValue) params.set("search", searchValue);
            if (e.target.value) params.set("status", e.target.value);
            router.push(`${pathname}?${params.toString()}`);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="deceased">Deceased</option>
        </select>
      </div>

      <div className="rounded-lg border overflow-hidden bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Member</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 hidden sm:table-cell">City</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 hidden md:table-cell">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500 hidden lg:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/org/${slug}/members/${m.id}`}
                    className="font-medium text-emerald-600 hover:underline"
                  >
                    {m.first_name} {m.last_name}
                  </Link>
                  <div className="text-xs text-gray-400">{m.member_number}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">{m.phone}</td>
                <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{m.city ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{m.membership_type ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    m.status === "active" ? "bg-green-100 text-green-700" :
                    m.status === "inactive" ? "bg-gray-100 text-gray-600" :
                    "bg-red-100 text-red-600"
                  }`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{formatDate(m.created_at)}</td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  {search ? `No members found for "${search}"` : "No members yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalCount)} of {totalCount}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/org/${slug}/members?page=${page - 1}${search ? `&search=${search}` : ""}${status ? `&status=${status}` : ""}`}
                className="rounded-md border px-3 py-1 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page * pageSize < totalCount && (
              <Link
                href={`/org/${slug}/members?page=${page + 1}${search ? `&search=${search}` : ""}${status ? `&status=${status}` : ""}`}
                className="rounded-md border px-3 py-1 hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

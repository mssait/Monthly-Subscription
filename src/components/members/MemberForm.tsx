"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { memberSchema, type MemberFormValues } from "@/lib/validations/member";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Member } from "@/lib/supabase/types";

interface MemberFormProps {
  orgId: string;
  slug: string;
  member?: Member;
}

export default function MemberForm({ orgId, slug, member }: MemberFormProps) {
  const router = useRouter();
  const isEdit = !!member;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: member
      ? {
          first_name: member.first_name,
          last_name: member.last_name ?? "",
          phone: member.phone,
          email: member.email ?? "",
          address: member.address ?? "",
          city: member.city ?? "",
          pincode: member.pincode ?? "",
          membership_type: member.membership_type ?? "",
          status: member.status,
          notes: member.notes ?? "",
        }
      : { status: "active" },
  });

  async function onSubmit(values: MemberFormValues) {
    const url = isEdit ? `/api/members/${member.id}` : "/api/members";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, org_id: orgId }),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Failed to save member");
      return;
    }

    toast.success(isEdit ? "Member updated" : "Member added");
    router.push(`/org/${slug}/members`);
    router.refresh();
  }

  const field = (name: keyof MemberFormValues) => ({
    ...register(name),
    className:
      "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border bg-white p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">First name *</label>
          <input {...field("first_name")} placeholder="Ahmed" />
          {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
          <input {...field("last_name")} placeholder="Khan" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mobile number *</label>
        <div className="flex rounded-md border border-gray-300 overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
          <span className="bg-gray-50 px-3 py-2 text-sm text-gray-500 border-r">+91</span>
          <input
            {...register("phone")}
            className="flex-1 px-3 py-2 text-sm outline-none"
            placeholder="9876543210"
            maxLength={10}
          />
        </div>
        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input {...field("email")} type="email" placeholder="ahmed@example.com" />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input {...field("city")} placeholder="Mumbai" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
          <input {...field("pincode")} placeholder="400001" maxLength={6} />
          {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <textarea {...register("address")} className={`${field("address").className} resize-none`} rows={2} placeholder="House no, Street, Area" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Membership type</label>
          <input {...field("membership_type")} placeholder="e.g. General, Lifetime" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select {...register("status")} className={field("status").className}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="deceased">Deceased</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea {...register("notes")} className={`${field("notes").className} resize-none`} rows={2} />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Add member"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { organizationSchema, type OrganizationFormValues } from "@/lib/validations/organization";
import { ORG_TYPE_OPTIONS } from "@/lib/constants/orgTypes";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Organization } from "@/lib/supabase/types";

interface OrgSettingsFormProps {
  org: Organization;
}

export default function OrgSettingsForm({ org }: OrgSettingsFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: org.name,
      slug: org.slug,
      org_type: org.org_type,
      address: org.address ?? "",
      city: org.city ?? "",
      state: org.state ?? "",
      pincode: org.pincode ?? "",
      phone: org.phone ?? "",
      email: org.email ?? "",
      website: org.website ?? "",
    },
  });

  async function onSubmit(values: OrganizationFormValues) {
    const res = await fetch(`/api/orgs/${org.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? "Failed to update settings");
      return;
    }

    toast.success("Settings saved");
    // If slug changed, redirect to new slug
    const updated = await res.json();
    if (updated.slug !== org.slug) {
      router.push(`/org/${updated.slug}/settings`);
    } else {
      router.refresh();
    }
  }

  const inputClass = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-lg border bg-white p-6 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Organisation type</label>
          <select {...register("org_type")} className={inputClass}>
            {ORG_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
          <input {...register("name")} className={inputClass} />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL slug *</label>
        <div className="flex rounded-md border border-gray-300 overflow-hidden focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
          <span className="bg-gray-50 px-3 py-2 text-sm text-gray-500 border-r">/org/</span>
          <input {...register("slug")} className="flex-1 px-3 py-2 text-sm outline-none" />
        </div>
        {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug.message}</p>}
      </div>

      <hr className="border-gray-100" />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <textarea {...register("address")} className={`${inputClass} resize-none`} rows={2} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input {...register("city")} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input {...register("state")} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
          <input {...register("pincode")} className={inputClass} maxLength={6} />
          {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input {...register("phone")} className={inputClass} placeholder="9876543210" />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" {...register("email")} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
        <input type="url" {...register("website")} className={inputClass} placeholder="https://" />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save settings"}
        </button>
      </div>
    </form>
  );
}

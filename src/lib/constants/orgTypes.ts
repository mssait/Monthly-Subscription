import type { OrgType } from "@/lib/supabase/types";

export const ORG_TYPE_CONFIG: Record<
  OrgType,
  { label: string; emoji: string; color: string }
> = {
  masjid: { label: "Masjid", emoji: "🕌", color: "text-emerald-600" },
  temple: { label: "Temple", emoji: "🛕", color: "text-orange-600" },
  church: { label: "Church", emoji: "⛪", color: "text-blue-600" },
  gurudwara: { label: "Gurudwara", emoji: "🏛️", color: "text-yellow-600" },
  other: { label: "Other", emoji: "🏠", color: "text-gray-600" },
};

export const ORG_TYPE_OPTIONS = Object.entries(ORG_TYPE_CONFIG).map(
  ([value, config]) => ({
    value: value as OrgType,
    label: `${config.emoji} ${config.label}`,
  })
);

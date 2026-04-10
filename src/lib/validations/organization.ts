import { z } from "zod";

export const organizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(60)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
  org_type: z.enum(["masjid", "temple", "church", "gurudwara", "other"]),
  address: z.string().max(500).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(100).optional().or(z.literal("")),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export type OrganizationFormValues = z.infer<typeof organizationSchema>;

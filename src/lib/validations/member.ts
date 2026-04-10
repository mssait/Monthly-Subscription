import { z } from "zod";

export const memberSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().max(100).optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode")
    .optional()
    .or(z.literal("")),
  membership_type: z.string().max(100).optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "deceased"]).default("active"),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type MemberFormValues = z.infer<typeof memberSchema>;

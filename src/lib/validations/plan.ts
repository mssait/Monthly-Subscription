import { z } from "zod";

export const planSchema = z
  .object({
    name: z.string().min(1, "Plan name is required").max(200),
    description: z.string().max(500).optional().or(z.literal("")),
    amount: z
      .number({ invalid_type_error: "Amount must be a number" })
      .positive("Amount must be greater than 0")
      .max(10000000, "Amount too large"),
    billing_cycle: z.enum([
      "monthly",
      "quarterly",
      "half_yearly",
      "yearly",
      "one_time",
      "custom",
    ]),
    custom_days: z.number().int().positive().optional().nullable(),
    is_active: z.boolean().default(true),
    allows_partial: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.billing_cycle === "custom" && !data.custom_days) return false;
      return true;
    },
    { message: "Custom days is required for custom billing cycle", path: ["custom_days"] }
  );

export type PlanFormValues = z.infer<typeof planSchema>;

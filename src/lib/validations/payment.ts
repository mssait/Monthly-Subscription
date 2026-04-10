import { z } from "zod";

export const manualPaymentSchema = z.object({
  member_id: z.string().uuid("Select a member"),
  subscription_id: z.string().uuid().optional().nullable(),
  amount: z
    .number({ invalid_type_error: "Amount must be a number" })
    .positive("Amount must be greater than 0"),
  payment_method: z.enum([
    "cash",
    "upi",
    "card",
    "net_banking",
    "cheque",
    "bank_transfer",
    "other",
  ]),
  payment_date: z.string().min(1, "Payment date is required"),
  reference_number: z.string().max(100).optional().or(z.literal("")),
  period_start: z.string().optional().nullable(),
  period_end: z.string().optional().nullable(),
  notes: z.string().max(500).optional().or(z.literal("")),
});

export type ManualPaymentFormValues = z.infer<typeof manualPaymentSchema>;

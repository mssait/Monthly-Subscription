import {
  addMonths,
  addDays,
  addYears,
  addQuarters,
  format,
  parseISO,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import type { BillingCycle } from "@/lib/supabase/types";

const IST = "Asia/Kolkata";

export function nowIST(): Date {
  return toZonedTime(new Date(), IST);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "dd MMM yyyy");
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(toZonedTime(d, IST), "dd MMM yyyy, hh:mm a");
}

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Calculate the next due date based on billing cycle.
 * @param fromDate - the current due date (or start date for first cycle)
 * @param cycle - the billing cycle
 * @param customDays - used only when cycle is 'custom'
 */
export function calculateNextDueDate(
  fromDate: Date | string,
  cycle: BillingCycle,
  customDays?: number | null
): Date {
  const base = typeof fromDate === "string" ? parseISO(fromDate) : fromDate;

  switch (cycle) {
    case "monthly":
      return addMonths(base, 1);
    case "quarterly":
      return addQuarters(base, 1);
    case "half_yearly":
      return addMonths(base, 6);
    case "yearly":
      return addYears(base, 1);
    case "one_time":
      return base; // no next due date
    case "custom":
      return addDays(base, customDays ?? 30);
    default:
      return addMonths(base, 1);
  }
}

export function isOverdue(nextDueDate: string | null): boolean {
  if (!nextDueDate) return false;
  const due = parseISO(nextDueDate);
  const today = nowIST();
  return due < today;
}

export function daysUntilDue(nextDueDate: string | null): number | null {
  if (!nextDueDate) return null;
  const due = parseISO(nextDueDate);
  const today = nowIST();
  const diffMs = due.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

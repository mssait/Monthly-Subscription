/**
 * Format a number as Indian Rupees (INR).
 * Uses the Indian numbering system (lakhs, crores).
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as a plain INR string without the symbol.
 */
export function formatINRPlain(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse a string like "1,00,000" or "100000" to a number.
 */
export function parseINR(value: string): number {
  return parseFloat(value.replace(/[^\d.]/g, ""));
}

import { addDays, addWeeks, addMonths, addYears, endOfMonth, getDate, setDate, min } from 'date-fns';

export type BillingInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/**
 * Calculate the next billing date from a given date based on billing interval.
 * Handles month-end edge cases (e.g., Jan 31 → Feb 28/29).
 */
export function calculateNextBillingDate(
  currentDate: Date,
  interval: BillingInterval,
  originalDay?: number
): Date {
  switch (interval) {
    case 'DAILY':
      return addDays(currentDate, 1);
    case 'WEEKLY':
      return addWeeks(currentDate, 1);
    case 'MONTHLY': {
      const targetDay = originalDay ?? getDate(currentDate);
      const nextMonth = addMonths(currentDate, 1);
      const lastDayOfNextMonth = endOfMonth(nextMonth);
      // Use the smaller of targetDay and lastDayOfMonth to handle Jan 31 → Feb 28
      return min([setDate(nextMonth, targetDay), lastDayOfNextMonth]);
    }
    case 'YEARLY':
      return addYears(currentDate, 1);
    default:
      throw new Error(`Unknown billing interval: ${interval}`);
  }
}

/**
 * Calculate billing period end date (day before next billing)
 */
export function calculateBillingPeriodEnd(nextBillingDate: Date): Date {
  return addDays(nextBillingDate, -1);
}

/**
 * Generate a sequential number string with zero-padding
 */
export function padSequence(num: number, length = 6): string {
  return String(num).padStart(length, '0');
}

/**
 * Generate a subscription number: SUB-YYYY-XXXXXX
 */
export function generateSubscriptionNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `SUB-${year}-${padSequence(sequence)}`;
}

/**
 * Generate an invoice number: INV-YYYY-XXXXXX
 */
export function generateInvoiceNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `INV-${year}-${padSequence(sequence)}`;
}

/**
 * Generate a quotation number: QUO-YYYY-XXXXXX
 */
export function generateQuotationNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `QUO-${year}-${padSequence(sequence)}`;
}

/**
 * Returns true if the given date is past due (before today)
 */
export function isOverdue(dueDate: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

/**
 * Format date to ISO date string (YYYY-MM-DD)
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}


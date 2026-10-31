import { add, subtract, multiply, applyPercentage, nonNegative, formatINR, Decimal } from '../utils/currencyUtils';
import { calculateNextBillingDate, calculateBillingPeriodEnd, generateInvoiceNumber, generateSubscriptionNumber } from '../utils/dateUtils';

describe('Financial Calculation Engine (Decimal.js)', () => {
  it('prevents floating point errors when adding decimals', () => {
    // 0.1 + 0.2 in JS float is 0.30000000000000004
    const result = add(0.1, 0.2);
    expect(result.toString()).toBe('0.3');
  });

  it('correctly calculates percentage tax and rounds half-up to 2 decimal places', () => {
    // 1560 * 18% = 280.8
    const tax = applyPercentage(1560, 18);
    expect(tax.toString()).toBe('280.8');

    // 123.456 rounded to 2 places
    const tax2 = applyPercentage(1234.56, 5);
    expect(tax2.toString()).toBe('61.73');
  });

  it('multiplies quantity and variant price accurately', () => {
    const total = multiply(3, 1560);
    expect(total.toString()).toBe('4680');
  });

  it('guarantees non-negative totals', () => {
    const negative = new Decimal(-50);
    const floored = nonNegative(negative);
    expect(floored.toString()).toBe('0');
  });
});

describe('Date & Billing Interval Calculations', () => {
  it('calculates daily next billing date', () => {
    const base = new Date(2025, 0, 15);
    const next = calculateNextBillingDate(base, 'DAILY');
    expect(next.getDate()).toBe(16);
  });

  it('calculates weekly next billing date', () => {
    const base = new Date(2025, 0, 15);
    const next = calculateNextBillingDate(base, 'WEEKLY');
    expect(next.getDate()).toBe(22);
  });

  it('handles month-end billing date transitions properly (Jan 31 -> Feb 28 in non-leap)', () => {
    const jan31 = new Date(2025, 0, 31);
    const next = calculateNextBillingDate(jan31, 'MONTHLY', 31);
    // February 2025 has 28 days
    expect(next.getMonth()).toBe(1); // February
    expect(next.getDate()).toBe(28);
  });

  it('generates sequential invoice and subscription numbers', () => {
    const subNo = generateSubscriptionNumber(42);
    const invNo = generateInvoiceNumber(105);
    expect(subNo).toMatch(/^SUB-\d{4}-000042$/);
    expect(invNo).toMatch(/^INV-\d{4}-000105$/);
  });
});


import Decimal from 'decimal.js';

// Configure Decimal.js for financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Safely add two monetary values
 */
export function add(a: Decimal | string | number, b: Decimal | string | number): Decimal {
  return new Decimal(a).plus(new Decimal(b));
}

/**
 * Safely subtract two monetary values
 */
export function subtract(a: Decimal | string | number, b: Decimal | string | number): Decimal {
  return new Decimal(a).minus(new Decimal(b));
}

/**
 * Safely multiply (e.g., quantity × price)
 */
export function multiply(a: Decimal | string | number, b: Decimal | string | number): Decimal {
  return new Decimal(a).times(new Decimal(b));
}

/**
 * Calculate percentage: amount × (rate / 100)
 */
export function applyPercentage(amount: Decimal | string | number, rate: Decimal | string | number): Decimal {
  return new Decimal(amount).times(new Decimal(rate)).dividedBy(100).toDecimalPlaces(2);
}

/**
 * Ensure a value is never negative (floor at 0)
 */
export function nonNegative(value: Decimal): Decimal {
  return value.isNegative() ? new Decimal(0) : value;
}

/**
 * Round to 2 decimal places (financial standard)
 */
export function round2(value: Decimal | string | number): Decimal {
  return new Decimal(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Convert Prisma Decimal to Decimal.js Decimal
 */
export function toDecimal(value: any): Decimal {
  return new Decimal(value.toString());
}

/**
 * Format currency for display (INR)
 */
export function formatINR(value: Decimal | string | number): string {
  const num = parseFloat(new Decimal(value).toFixed(2));
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(num);
}

export { Decimal };


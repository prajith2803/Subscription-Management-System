import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, getStatusBadgeVariant } from '../utils';

describe('Frontend Currency Formatter', () => {
  it('formats Indian Rupee currency with symbol', () => {
    expect(formatCurrency(1560)).toContain('1,560.00');
    expect(formatCurrency('50000')).toContain('50,000.00');
  });

  it('handles null and undefined gracefully', () => {
    expect(formatCurrency(null)).toBe('₹0.00');
    expect(formatCurrency(undefined)).toBe('₹0.00');
  });
});

describe('Frontend Date Formatter', () => {
  it('formats dates in readable Indian English format', () => {
    const formatted = formatDate('2025-01-31T00:00:00.000Z');
    expect(formatted).not.toBe('—');
  });

  it('returns dash on invalid date input', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('invalid-date')).toBe('—');
  });
});

describe('Status Badge Variant Mapping', () => {
  it('returns appropriate emerald classes for active or paid states', () => {
    expect(getStatusBadgeVariant('ACTIVE')).toContain('emerald');
    expect(getStatusBadgeVariant('PAID')).toContain('emerald');
  });

  it('returns amber classes for partial or pending states', () => {
    expect(getStatusBadgeVariant('PARTIALLY_PAID')).toContain('amber');
    expect(getStatusBadgeVariant('PAUSED')).toContain('amber');
  });

  it('returns rose classes for closed or overdue states', () => {
    expect(getStatusBadgeVariant('OVERDUE')).toContain('rose');
    expect(getStatusBadgeVariant('CLOSED')).toContain('rose');
  });
});


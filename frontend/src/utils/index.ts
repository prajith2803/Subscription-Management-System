import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return '₹0.00';
  const num = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDate(dateStr: string | Date | undefined | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function getStatusBadgeVariant(status: string): string {
  switch (status.toUpperCase()) {
    case 'ACTIVE':
    case 'PAID':
    case 'CONFIRMED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'PARTIALLY_PAID':
    case 'PAUSED':
    case 'DRAFT':
    case 'SENT':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'OVERDUE':
    case 'CLOSED':
    case 'CANCELLED':
    case 'EXPIRED':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}


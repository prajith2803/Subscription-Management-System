export type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';
export type ProductType = 'SOFTWARE' | 'SERVICE' | 'ADDON';
export type BillingInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type QuotationStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
export type SubscriptionStatus = 'DRAFT' | 'QUOTATION' | 'CONFIRMED' | 'ACTIVE' | 'PAUSED' | 'CLOSED' | 'CANCELLED';
export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'OVERDUE';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'OTHER';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name?: string;
  customerId?: string;
  company?: string;
  phone?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;
  taxId?: string | null;
  isActive: boolean;
  createdAt: string;
  user?: { email: string };
  subscriptions?: Subscription[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  additionalPrice: number | string;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  salesPrice: number | string;
  costPrice: number | string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  variants?: ProductVariant[];
}

export interface Plan {
  id: string;
  name: string;
  description?: string | null;
  billingInterval: BillingInterval;
  price: number | string;
  minimumQuantity: number;
  availableFrom?: string | null;
  availableTo?: string | null;
  autoClose: boolean;
  allowEarlyClose: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  isActive: boolean;
  planProducts?: Array<{
    id: string;
    product: Product;
    variant?: ProductVariant | null;
    defaultQuantity: number;
  }>;
}

export interface QuotationLine {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number | string;
  discountAmount: number | string;
  taxAmount: number | string;
  lineTotal: number | string;
  product?: Product;
  variant?: ProductVariant | null;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  planId: string;
  templateId?: string | null;
  createdDate: string;
  expiryDate: string;
  paymentTerms?: string | null;
  subtotal: number | string;
  discountAmount: number | string;
  taxAmount: number | string;
  grandTotal: number | string;
  status: QuotationStatus;
  customer?: Customer;
  plan?: Plan;
  lines?: QuotationLine[];
}

export interface SubscriptionLine {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number | string;
  lineTotal: number | string;
  product?: Product;
  variant?: ProductVariant | null;
}

export interface Subscription {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  planId: string;
  quotationId?: string | null;
  startDate: string;
  endDate?: string | null;
  nextBillingDate: string;
  paymentTerms?: string | null;
  monthlyValue: number | string;
  status: SubscriptionStatus;
  closeReason?: string | null;
  createdAt: string;
  customer?: Customer;
  plan: Plan;
  lines?: SubscriptionLine[];
  invoices?: Invoice[];
}

export interface InvoiceLine {
  id: string;
  productId: string;
  variantId?: string | null;
  productNameSnapshot: string;
  variantNameSnapshot?: string | null;
  unitPriceSnapshot: number | string;
  quantity: number;
  discountAmount: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  lineSubtotal: number | string;
  lineTotal: number | string;
  product?: Product;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  subscriptionId: string;
  invoiceDate: string;
  dueDate: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  subtotal: number | string;
  discountAmount: number | string;
  taxAmount: number | string;
  grandTotal: number | string;
  amountPaid: number | string;
  outstandingBalance: number | string;
  status: InvoiceStatus;
  customer?: Customer;
  subscription?: Subscription;
  lines?: InvoiceLine[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  recordedByUserId: string;
  paymentMethod: PaymentMethod;
  amount: number | string;
  paymentDate: string;
  transactionReference?: string | null;
  notes?: string | null;
  createdAt: string;
  customer?: Customer;
  invoice?: Invoice;
  recordedBy?: { email: string };
}

export interface TaxRule {
  id: string;
  name: string;
  percentage: number | string;
  fixedAmount: number | string;
  taxType: 'PERCENTAGE' | 'FIXED';
  appliesToAll: boolean;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isActive: boolean;
}

export interface Discount {
  id: string;
  code: string;
  name: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  value: number | string;
  minimumAmount: number | string;
  minimumQuantity: number;
  startDate?: string | null;
  endDate?: string | null;
  maxUsageCount?: number | null;
  usageCount: number;
  isSubscriptionWide: boolean;
  isActive: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  eventType: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  changeDetails?: any;
  ipAddress?: string | null;
  createdAt: string;
  user?: { email: string; role: Role };
}

export interface DashboardKPIs {
  totalCustomers: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  newSubscriptionsThisMonth: number;
  totalInvoices: number;
  totalRevenue: string;
  outstandingAmount: string;
  totalBilled: string;
  overdueInvoicesCount: number;
}


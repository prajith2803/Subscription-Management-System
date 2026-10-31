import { prisma } from '../config/database';

export interface AuditOptions {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changeDetails?: Record<string, unknown>;
  ipAddress?: string;
}

export async function createAuditLog(options: AuditOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        changeDetails: options.changeDetails as any,
        ipAddress: options.ipAddress,
      },
    });
  } catch (err) {
    // Audit log failures should not crash business operations
    console.error('⚠️  Failed to write audit log:', err);
  }
}

export const AuditActions = {
  // Auth
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',

  // Users
  STAFF_CREATED: 'STAFF_CREATED',
  STAFF_UPDATED: 'STAFF_UPDATED',
  STAFF_DEACTIVATED: 'STAFF_DEACTIVATED',

  // Customers
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
  CUSTOMER_DEACTIVATED: 'CUSTOMER_DEACTIVATED',

  // Products
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  PRODUCT_DEACTIVATED: 'PRODUCT_DEACTIVATED',
  VARIANT_CREATED: 'VARIANT_CREATED',
  VARIANT_UPDATED: 'VARIANT_UPDATED',

  // Plans
  PLAN_CREATED: 'PLAN_CREATED',
  PLAN_UPDATED: 'PLAN_UPDATED',
  PLAN_ARCHIVED: 'PLAN_ARCHIVED',

  // Quotations
  QUOTATION_CREATED: 'QUOTATION_CREATED',
  QUOTATION_UPDATED: 'QUOTATION_UPDATED',
  QUOTATION_CONFIRMED: 'QUOTATION_CONFIRMED',
  QUOTATION_CANCELLED: 'QUOTATION_CANCELLED',

  // Subscriptions
  SUBSCRIPTION_CREATED: 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_ACTIVATED: 'SUBSCRIPTION_ACTIVATED',
  SUBSCRIPTION_PAUSED: 'SUBSCRIPTION_PAUSED',
  SUBSCRIPTION_RESUMED: 'SUBSCRIPTION_RESUMED',
  SUBSCRIPTION_CLOSED: 'SUBSCRIPTION_CLOSED',
  SUBSCRIPTION_RENEWED: 'SUBSCRIPTION_RENEWED',

  // Taxes & Discounts
  TAX_CREATED: 'TAX_CREATED',
  TAX_UPDATED: 'TAX_UPDATED',
  DISCOUNT_CREATED: 'DISCOUNT_CREATED',
  DISCOUNT_UPDATED: 'DISCOUNT_UPDATED',

  // Invoices
  INVOICE_GENERATED: 'INVOICE_GENERATED',
  INVOICE_CONFIRMED: 'INVOICE_CONFIRMED',
  INVOICE_CANCELLED: 'INVOICE_CANCELLED',

  // Payments
  PAYMENT_RECORDED: 'PAYMENT_RECORDED',

  // Billing
  BILLING_RUN_TRIGGERED: 'BILLING_RUN_TRIGGERED',
};


import { PrismaClient, Role, ProductType, BillingInterval, QuotationStatus, SubscriptionStatus, InvoiceStatus, PaymentMethod, TaxType, DiscountType } from '@prisma/client';
import bcrypt from 'bcrypt';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

// ── Sequence helpers ──────────────────────────────────────────────────────────
let subSeq = 0;
let invSeq = 0;
let quoSeq = 0;

function nextSubNumber() { return `SUB-2025-${String(++subSeq).padStart(6, '0')}`; }
function nextInvNumber() { return `INV-2025-${String(++invSeq).padStart(6, '0')}`; }
function nextQuoNumber() { return `QUO-2025-${String(++quoSeq).padStart(6, '0')}`; }

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

async function main() {
  console.log('🌱 Starting database seed...');

  // ── Clean in correct order ───────────────────────────────────────────────
  await prisma.discountUsage.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscriptionLine.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.quotationLine.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.quotationTemplateLine.deleteMany();
  await prisma.quotationTemplate.deleteMany();
  await prisma.planProduct.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.discountProduct.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.taxRuleProduct.deleteMany();
  await prisma.taxRule.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.billingJobLog.deleteMany();

  console.log('  ✅ Old data cleaned');

  // ─────────────────────────────────────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin@123!', BCRYPT_ROUNDS);
  const staffHash = await bcrypt.hash('Staff@123!', BCRYPT_ROUNDS);
  const customerHash = await bcrypt.hash('Customer@123!', BCRYPT_ROUNDS);

  const adminUser = await prisma.user.create({
    data: { email: 'admin@brightloop.com', passwordHash: adminHash, role: 'ADMIN' },
  });

  const staff1User = await prisma.user.create({
    data: { email: 'staff1@brightloop.com', passwordHash: staffHash, role: 'STAFF' },
  });

  const staff2User = await prisma.user.create({
    data: { email: 'staff2@brightloop.com', passwordHash: staffHash, role: 'STAFF' },
  });

  // Create staff customer profiles
  await prisma.customer.create({
    data: { userId: adminUser.id, name: 'Admin User', company: 'Brightloop Software' },
  });
  await prisma.customer.create({
    data: { userId: staff1User.id, name: 'Alice Johnson', company: 'Brightloop Software' },
  });
  await prisma.customer.create({
    data: { userId: staff2User.id, name: 'Bob Smith', company: 'Brightloop Software' },
  });

  // Customer users
  const customerUsers = await Promise.all([
    prisma.user.create({ data: { email: 'customer1@example.com', passwordHash: customerHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'customer2@example.com', passwordHash: customerHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'customer3@example.com', passwordHash: customerHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'customer4@example.com', passwordHash: customerHash, role: 'CUSTOMER' } }),
    prisma.user.create({ data: { email: 'customer5@example.com', passwordHash: customerHash, role: 'CUSTOMER' } }),
  ]);

  const customers = await Promise.all([
    prisma.customer.create({ data: { userId: customerUsers[0].id, name: 'Rajesh Kumar', phone: '+91-9876543210', company: 'TechVentures Pvt Ltd', city: 'Mumbai', state: 'Maharashtra', country: 'India' } }),
    prisma.customer.create({ data: { userId: customerUsers[1].id, name: 'Priya Sharma', phone: '+91-9876543211', company: 'InnovateSoft', city: 'Bangalore', state: 'Karnataka', country: 'India' } }),
    prisma.customer.create({ data: { userId: customerUsers[2].id, name: 'Amit Patel', phone: '+91-9876543212', company: 'Digital Solutions Ltd', city: 'Ahmedabad', state: 'Gujarat', country: 'India' } }),
    prisma.customer.create({ data: { userId: customerUsers[3].id, name: 'Sunita Reddy', phone: '+91-9876543213', company: 'SmartBiz Corp', city: 'Hyderabad', state: 'Telangana', country: 'India' } }),
    prisma.customer.create({ data: { userId: customerUsers[4].id, name: 'Vikram Singh', phone: '+91-9876543214', company: 'FutureTech Systems', city: 'Delhi', state: 'Delhi', country: 'India' } }),
  ]);

  console.log('  ✅ Users and customers created');

  // ─────────────────────────────────────────────────────────────────────────
  // PRODUCTS & VARIANTS
  // ─────────────────────────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.create({ data: { name: 'Odoo ERP', type: 'SOFTWARE', salesPrice: 5000, costPrice: 1000, description: 'Complete ERP solution for business management' } }),
    prisma.product.create({ data: { name: 'CRM Suite', type: 'SOFTWARE', salesPrice: 3000, costPrice: 800, description: 'Customer relationship management platform' } }),
    prisma.product.create({ data: { name: 'HR Module', type: 'SOFTWARE', salesPrice: 2000, costPrice: 500, description: 'Human resources and payroll management' } }),
    prisma.product.create({ data: { name: 'Inventory Pro', type: 'SOFTWARE', salesPrice: 2500, costPrice: 600, description: 'Advanced inventory and warehouse management' } }),
    prisma.product.create({ data: { name: 'Analytics Plus', type: 'ADDON', salesPrice: 1500, costPrice: 300, description: 'Advanced business analytics and reporting dashboard' } }),
  ]);

  // Variants for Odoo ERP
  const odooEnterprise = await prisma.productVariant.create({
    data: { productId: products[0].id, name: 'Enterprise Edition', additionalPrice: 2500 },
  });
  const odooCommunity = await prisma.productVariant.create({
    data: { productId: products[0].id, name: 'Community Edition', additionalPrice: 0 },
  });

  // Variants for CRM Suite
  const crmPro = await prisma.productVariant.create({
    data: { productId: products[1].id, name: 'Pro (50 users)', additionalPrice: 1500 },
  });
  const crmStarter = await prisma.productVariant.create({
    data: { productId: products[1].id, name: 'Starter (10 users)', additionalPrice: 0 },
  });

  // Variants for HR Module
  await prisma.productVariant.create({
    data: { productId: products[2].id, name: 'With Payroll', additionalPrice: 800 },
  });
  await prisma.productVariant.create({
    data: { productId: products[2].id, name: 'Basic HR', additionalPrice: 0 },
  });

  // Variants for Inventory Pro
  await prisma.productVariant.create({
    data: { productId: products[3].id, name: 'Multi-Warehouse', additionalPrice: 1000 },
  });

  // Analytics Plus - no variants

  console.log('  ✅ Products and variants created');

  // ─────────────────────────────────────────────────────────────────────────
  // SUBSCRIPTION PLANS
  // ─────────────────────────────────────────────────────────────────────────
  const plans = await Promise.all([
    prisma.plan.create({
      data: {
        name: 'Starter Monthly',
        description: 'Entry-level monthly subscription for small businesses',
        billingInterval: 'MONTHLY',
        price: 5000,
        minimumQuantity: 1,
        allowPause: true,
        allowEarlyClose: true,
        allowRenewal: true,
        autoClose: false,
      },
    }),
    prisma.plan.create({
      data: {
        name: 'Pro Monthly',
        description: 'Professional monthly plan with full feature access',
        billingInterval: 'MONTHLY',
        price: 10000,
        minimumQuantity: 1,
        allowPause: true,
        allowEarlyClose: true,
        allowRenewal: true,
        autoClose: false,
      },
    }),
    prisma.plan.create({
      data: {
        name: 'Starter Yearly',
        description: 'Annual starter plan with 2 months free',
        billingInterval: 'YEARLY',
        price: 50000,
        minimumQuantity: 1,
        allowPause: false,
        allowEarlyClose: false,
        allowRenewal: true,
        autoClose: true,
        availableTo: new Date('2026-12-31'),
      },
    }),
    prisma.plan.create({
      data: {
        name: 'Enterprise Yearly',
        description: 'Full enterprise annual subscription with SLA',
        billingInterval: 'YEARLY',
        price: 120000,
        minimumQuantity: 1,
        allowPause: false,
        allowEarlyClose: false,
        allowRenewal: true,
        autoClose: false,
      },
    }),
  ]);

  // Link products to plans
  await prisma.planProduct.createMany({
    data: [
      { planId: plans[0].id, productId: products[0].id, variantId: odooCommunity.id, defaultQuantity: 1 },
      { planId: plans[1].id, productId: products[0].id, variantId: odooEnterprise.id, defaultQuantity: 1 },
      { planId: plans[1].id, productId: products[1].id, variantId: crmPro.id, defaultQuantity: 1 },
      { planId: plans[2].id, productId: products[0].id, variantId: odooCommunity.id, defaultQuantity: 1 },
      { planId: plans[2].id, productId: products[2].id, defaultQuantity: 1 },
      { planId: plans[3].id, productId: products[0].id, variantId: odooEnterprise.id, defaultQuantity: 1 },
      { planId: plans[3].id, productId: products[1].id, variantId: crmPro.id, defaultQuantity: 1 },
      { planId: plans[3].id, productId: products[2].id, defaultQuantity: 1 },
      { planId: plans[3].id, productId: products[3].id, defaultQuantity: 1 },
      { planId: plans[3].id, productId: products[4].id, defaultQuantity: 1 },
    ],
  });

  console.log('  ✅ Plans created');

  // ─────────────────────────────────────────────────────────────────────────
  // TAX RULES
  // ─────────────────────────────────────────────────────────────────────────
  await prisma.taxRule.createMany({
    data: [
      { name: 'GST 18%', percentage: 18, taxType: 'PERCENTAGE', appliesToAll: true, isActive: true },
      { name: 'GST 12%', percentage: 12, taxType: 'PERCENTAGE', appliesToAll: false, isActive: true },
      { name: 'GST 5%', percentage: 5, taxType: 'PERCENTAGE', appliesToAll: false, isActive: true },
    ],
  });

  console.log('  ✅ Tax rules created');

  // ─────────────────────────────────────────────────────────────────────────
  // DISCOUNTS
  // ─────────────────────────────────────────────────────────────────────────
  await prisma.discount.createMany({
    data: [
      {
        code: 'WELCOME10',
        name: 'Welcome 10% Off',
        discountType: 'PERCENTAGE',
        value: 10,
        minimumAmount: 1000,
        minimumQuantity: 1,
        maxUsageCount: 100,
        usageCount: 3,
        isSubscriptionWide: true,
        isActive: true,
        startDate: monthsAgo(6),
        endDate: daysFromNow(180),
      },
      {
        code: 'BULK20',
        name: 'Bulk Purchase 20% Off',
        discountType: 'PERCENTAGE',
        value: 20,
        minimumAmount: 10000,
        minimumQuantity: 3,
        maxUsageCount: 50,
        usageCount: 1,
        isSubscriptionWide: false,
        isActive: true,
        startDate: monthsAgo(3),
        endDate: daysFromNow(90),
      },
      {
        code: 'YEARLY5000',
        name: 'Yearly Plan ₹5000 Off',
        discountType: 'FIXED',
        value: 5000,
        minimumAmount: 50000,
        minimumQuantity: 1,
        maxUsageCount: null,
        usageCount: 2,
        isSubscriptionWide: true,
        isActive: true,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
      },
      {
        code: 'SUMMER25',
        name: 'Summer 25% Off (Expired)',
        discountType: 'PERCENTAGE',
        value: 25,
        minimumAmount: 0,
        minimumQuantity: 1,
        maxUsageCount: 200,
        usageCount: 45,
        isSubscriptionWide: true,
        isActive: false,
        startDate: new Date('2025-06-01'),
        endDate: new Date('2025-08-31'),
      },
    ],
  });

  console.log('  ✅ Discounts created');

  // ─────────────────────────────────────────────────────────────────────────
  // QUOTATION TEMPLATES
  // ─────────────────────────────────────────────────────────────────────────
  const template1 = await prisma.quotationTemplate.create({
    data: {
      name: 'Starter Package Template',
      validityDays: 30,
      defaultPlanId: plans[0].id,
      notes: 'Standard starter package for new SMB clients',
    },
  });
  await prisma.quotationTemplateLine.create({
    data: { templateId: template1.id, productId: products[0].id, variantId: odooCommunity.id, quantity: 1, unitPrice: 5000 },
  });

  const template2 = await prisma.quotationTemplate.create({
    data: {
      name: 'Pro Bundle Template',
      validityDays: 45,
      defaultPlanId: plans[1].id,
      notes: 'Professional bundle for growing businesses',
    },
  });
  await prisma.quotationTemplateLine.createMany({
    data: [
      { templateId: template2.id, productId: products[0].id, variantId: odooEnterprise.id, quantity: 1, unitPrice: 7500 },
      { templateId: template2.id, productId: products[1].id, variantId: crmPro.id, quantity: 1, unitPrice: 4500 },
    ],
  });

  const template3 = await prisma.quotationTemplate.create({
    data: {
      name: 'Enterprise Annual Template',
      validityDays: 60,
      defaultPlanId: plans[3].id,
      notes: 'Full enterprise suite for large organizations',
    },
  });
  await prisma.quotationTemplateLine.createMany({
    data: [
      { templateId: template3.id, productId: products[0].id, variantId: odooEnterprise.id, quantity: 1, unitPrice: 7500 },
      { templateId: template3.id, productId: products[1].id, variantId: crmPro.id, quantity: 1, unitPrice: 4500 },
      { templateId: template3.id, productId: products[2].id, quantity: 1, unitPrice: 2800 },
      { templateId: template3.id, productId: products[4].id, quantity: 1, unitPrice: 1500 },
    ],
  });

  console.log('  ✅ Quotation templates created');

  // ─────────────────────────────────────────────────────────────────────────
  // QUOTATIONS + SUBSCRIPTIONS + INVOICES + PAYMENTS
  // ─────────────────────────────────────────────────────────────────────────

  // Helper function to calculate billing period
  const billingStart = monthsAgo(1);
  const billingEnd = new Date();

  // ── SUBSCRIPTION 1: Active (Rajesh - Pro Monthly) ────────────────────────
  const quo1 = await prisma.quotation.create({
    data: {
      quotationNumber: nextQuoNumber(),
      customerId: customers[0].id,
      planId: plans[1].id,
      createdByUserId: staff1User.id,
      expiryDate: daysFromNow(-1),
      paymentTerms: 'Net 30',
      subtotal: 12000,
      taxAmount: 2160,
      grandTotal: 14160,
      status: 'CONFIRMED',
      lines: {
        create: [
          { productId: products[0].id, variantId: odooEnterprise.id, quantity: 1, unitPrice: 7500, lineTotal: 7500 },
          { productId: products[1].id, variantId: crmPro.id, quantity: 1, unitPrice: 4500, lineTotal: 4500 },
        ],
      },
    },
  });

  const sub1 = await prisma.subscription.create({
    data: {
      subscriptionNumber: nextSubNumber(),
      customerId: customers[0].id,
      planId: plans[1].id,
      quotationId: quo1.id,
      createdByUserId: staff1User.id,
      startDate: monthsAgo(3),
      nextBillingDate: daysFromNow(5),
      paymentTerms: 'Net 30',
      monthlyValue: 14160,
      status: 'ACTIVE',
      lines: {
        create: [
          { productId: products[0].id, variantId: odooEnterprise.id, quantity: 1, unitPrice: 7500, lineTotal: 7500 },
          { productId: products[1].id, variantId: crmPro.id, quantity: 1, unitPrice: 4500, lineTotal: 4500 },
        ],
      },
    },
  });

  // Paid invoice for sub1
  const inv1 = await prisma.invoice.create({
    data: {
      invoiceNumber: nextInvNumber(),
      customerId: customers[0].id,
      subscriptionId: sub1.id,
      dueDate: daysFromNow(-15),
      billingPeriodStart: monthsAgo(3),
      billingPeriodEnd: monthsAgo(2),
      subtotal: 12000,
      taxAmount: 2160,
      grandTotal: 14160,
      amountPaid: 14160,
      outstandingBalance: 0,
      status: 'PAID',
      lines: {
        create: [
          { productId: products[0].id, variantId: odooEnterprise.id, productNameSnapshot: 'Odoo ERP', variantNameSnapshot: 'Enterprise Edition', unitPriceSnapshot: 7500, quantity: 1, taxRate: 18, taxAmount: 1350, lineSubtotal: 7500, lineTotal: 8850 },
          { productId: products[1].id, variantId: crmPro.id, productNameSnapshot: 'CRM Suite', variantNameSnapshot: 'Pro (50 users)', unitPriceSnapshot: 4500, quantity: 1, taxRate: 18, taxAmount: 810, lineSubtotal: 4500, lineTotal: 5310 },
        ],
      },
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: inv1.id,
      customerId: customers[0].id,
      recordedByUserId: staff1User.id,
      paymentMethod: 'BANK_TRANSFER',
      amount: 14160,
      paymentDate: monthsAgo(2),
      transactionReference: 'TXN-001-2025',
    },
  });

  // Confirmed (unpaid) invoice for sub1 month 2
  const inv2 = await prisma.invoice.create({
    data: {
      invoiceNumber: nextInvNumber(),
      customerId: customers[0].id,
      subscriptionId: sub1.id,
      dueDate: daysFromNow(-5),
      billingPeriodStart: monthsAgo(2),
      billingPeriodEnd: monthsAgo(1),
      subtotal: 12000,
      taxAmount: 2160,
      grandTotal: 14160,
      amountPaid: 7000,
      outstandingBalance: 7160,
      status: 'PARTIALLY_PAID',
      lines: {
        create: [
          { productId: products[0].id, variantId: odooEnterprise.id, productNameSnapshot: 'Odoo ERP', variantNameSnapshot: 'Enterprise Edition', unitPriceSnapshot: 7500, quantity: 1, taxRate: 18, taxAmount: 1350, lineSubtotal: 7500, lineTotal: 8850 },
          { productId: products[1].id, variantId: crmPro.id, productNameSnapshot: 'CRM Suite', variantNameSnapshot: 'Pro (50 users)', unitPriceSnapshot: 4500, quantity: 1, taxRate: 18, taxAmount: 810, lineSubtotal: 4500, lineTotal: 5310 },
        ],
      },
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: inv2.id,
      customerId: customers[0].id,
      recordedByUserId: staff2User.id,
      paymentMethod: 'UPI',
      amount: 7000,
      paymentDate: daysFromNow(-3),
      transactionReference: 'UPI-202501',
    },
  });

  // ── SUBSCRIPTION 2: Active (Priya - Starter Monthly) ─────────────────────
  const quo2 = await prisma.quotation.create({
    data: {
      quotationNumber: nextQuoNumber(),
      customerId: customers[1].id,
      planId: plans[0].id,
      createdByUserId: staff1User.id,
      expiryDate: daysFromNow(30),
      paymentTerms: 'Net 15',
      subtotal: 5000,
      taxAmount: 900,
      grandTotal: 5900,
      status: 'CONFIRMED',
      lines: {
        create: [
          { productId: products[0].id, variantId: odooCommunity.id, quantity: 1, unitPrice: 5000, lineTotal: 5000 },
        ],
      },
    },
  });

  const sub2 = await prisma.subscription.create({
    data: {
      subscriptionNumber: nextSubNumber(),
      customerId: customers[1].id,
      planId: plans[0].id,
      quotationId: quo2.id,
      createdByUserId: staff1User.id,
      startDate: monthsAgo(2),
      nextBillingDate: daysFromNow(10),
      paymentTerms: 'Net 15',
      monthlyValue: 5900,
      status: 'ACTIVE',
      lines: {
        create: [
          { productId: products[0].id, variantId: odooCommunity.id, quantity: 1, unitPrice: 5000, lineTotal: 5000 },
        ],
      },
    },
  });

  const inv3 = await prisma.invoice.create({
    data: {
      invoiceNumber: nextInvNumber(),
      customerId: customers[1].id,
      subscriptionId: sub2.id,
      dueDate: daysFromNow(-20),
      billingPeriodStart: monthsAgo(2),
      billingPeriodEnd: monthsAgo(1),
      subtotal: 5000,
      taxAmount: 900,
      grandTotal: 5900,
      amountPaid: 5900,
      outstandingBalance: 0,
      status: 'PAID',
      lines: {
        create: [
          { productId: products[0].id, variantId: odooCommunity.id, productNameSnapshot: 'Odoo ERP', variantNameSnapshot: 'Community Edition', unitPriceSnapshot: 5000, quantity: 1, taxRate: 18, taxAmount: 900, lineSubtotal: 5000, lineTotal: 5900 },
        ],
      },
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: inv3.id, customerId: customers[1].id, recordedByUserId: staff1User.id,
      paymentMethod: 'CARD', amount: 5900, paymentDate: monthsAgo(1),
      transactionReference: 'CARD-5521',
    },
  });

  // ── SUBSCRIPTION 3: Paused (Amit - Pro Monthly) ───────────────────────────
  const sub3 = await prisma.subscription.create({
    data: {
      subscriptionNumber: nextSubNumber(),
      customerId: customers[2].id,
      planId: plans[1].id,
      createdByUserId: staff2User.id,
      startDate: monthsAgo(4),
      nextBillingDate: daysFromNow(15),
      paymentTerms: 'Net 30',
      monthlyValue: 8260,
      status: 'PAUSED',
      pausedAt: daysFromNow(-10),
      lines: {
        create: [
          { productId: products[0].id, variantId: odooEnterprise.id, quantity: 1, unitPrice: 7000, lineTotal: 7000 },
        ],
      },
    },
  });

  // ── SUBSCRIPTION 4: Active (Sunita - Enterprise Yearly) ──────────────────
  const sub4 = await prisma.subscription.create({
    data: {
      subscriptionNumber: nextSubNumber(),
      customerId: customers[3].id,
      planId: plans[3].id,
      createdByUserId: staff1User.id,
      startDate: monthsAgo(6),
      nextBillingDate: daysFromNow(180),
      paymentTerms: 'Net 45',
      monthlyValue: 141600,
      status: 'ACTIVE',
      lines: {
        create: [
          { productId: products[0].id, variantId: odooEnterprise.id, quantity: 1, unitPrice: 7500, lineTotal: 7500 },
          { productId: products[1].id, variantId: crmPro.id, quantity: 1, unitPrice: 4500, lineTotal: 4500 },
          { productId: products[2].id, quantity: 1, unitPrice: 2800, lineTotal: 2800 },
          { productId: products[3].id, quantity: 1, unitPrice: 3500, lineTotal: 3500 },
          { productId: products[4].id, quantity: 1, unitPrice: 1500, lineTotal: 1500 },
        ],
      },
    },
  });

  const inv4 = await prisma.invoice.create({
    data: {
      invoiceNumber: nextInvNumber(),
      customerId: customers[3].id,
      subscriptionId: sub4.id,
      dueDate: daysFromNow(30),
      billingPeriodStart: monthsAgo(6),
      billingPeriodEnd: daysFromNow(180),
      subtotal: 118000,
      taxAmount: 21240,
      grandTotal: 139240,
      amountPaid: 139240,
      outstandingBalance: 0,
      status: 'PAID',
      lines: {
        create: [
          { productId: products[0].id, variantId: odooEnterprise.id, productNameSnapshot: 'Odoo ERP', variantNameSnapshot: 'Enterprise Edition', unitPriceSnapshot: 7500, quantity: 1, taxRate: 18, taxAmount: 1350, lineSubtotal: 7500, lineTotal: 8850 },
          { productId: products[1].id, variantId: crmPro.id, productNameSnapshot: 'CRM Suite', variantNameSnapshot: 'Pro (50 users)', unitPriceSnapshot: 4500, quantity: 1, taxRate: 18, taxAmount: 810, lineSubtotal: 4500, lineTotal: 5310 },
          { productId: products[2].id, productNameSnapshot: 'HR Module', unitPriceSnapshot: 2800, quantity: 1, taxRate: 18, taxAmount: 504, lineSubtotal: 2800, lineTotal: 3304 },
          { productId: products[3].id, productNameSnapshot: 'Inventory Pro', unitPriceSnapshot: 3500, quantity: 1, taxRate: 18, taxAmount: 630, lineSubtotal: 3500, lineTotal: 4130 },
          { productId: products[4].id, productNameSnapshot: 'Analytics Plus', unitPriceSnapshot: 1500, quantity: 1, taxRate: 18, taxAmount: 270, lineSubtotal: 1500, lineTotal: 1770 },
        ],
      },
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: inv4.id, customerId: customers[3].id, recordedByUserId: staff1User.id,
      paymentMethod: 'BANK_TRANSFER', amount: 139240, paymentDate: monthsAgo(5),
      transactionReference: 'NEFT-ENT-001',
    },
  });

  // ── SUBSCRIPTION 5: Closed (Vikram - Starter Monthly) ────────────────────
  const sub5 = await prisma.subscription.create({
    data: {
      subscriptionNumber: nextSubNumber(),
      customerId: customers[4].id,
      planId: plans[0].id,
      createdByUserId: staff2User.id,
      startDate: monthsAgo(6),
      nextBillingDate: monthsAgo(1),
      paymentTerms: 'Net 30',
      monthlyValue: 5900,
      status: 'CLOSED',
      closedAt: monthsAgo(1),
      closeReason: 'Customer requested early termination',
      lines: {
        create: [
          { productId: products[0].id, variantId: odooCommunity.id, quantity: 1, unitPrice: 5000, lineTotal: 5000 },
        ],
      },
    },
  });

  // Overdue invoice for sub5
  const inv5 = await prisma.invoice.create({
    data: {
      invoiceNumber: nextInvNumber(),
      customerId: customers[4].id,
      subscriptionId: sub5.id,
      dueDate: monthsAgo(2),
      billingPeriodStart: monthsAgo(3),
      billingPeriodEnd: monthsAgo(2),
      subtotal: 5000,
      taxAmount: 900,
      grandTotal: 5900,
      amountPaid: 0,
      outstandingBalance: 5900,
      status: 'OVERDUE',
      lines: {
        create: [
          { productId: products[0].id, variantId: odooCommunity.id, productNameSnapshot: 'Odoo ERP', variantNameSnapshot: 'Community Edition', unitPriceSnapshot: 5000, quantity: 1, taxRate: 18, taxAmount: 900, lineSubtotal: 5000, lineTotal: 5900 },
        ],
      },
    },
  });

  // ── SUBSCRIPTION 6: Active (Priya - Additional) ───────────────────────────
  const sub6 = await prisma.subscription.create({
    data: {
      subscriptionNumber: nextSubNumber(),
      customerId: customers[1].id,
      planId: plans[0].id,
      createdByUserId: staff1User.id,
      startDate: monthsAgo(1),
      nextBillingDate: daysFromNow(0), // Due today — will be picked by scheduler
      paymentTerms: 'Net 15',
      monthlyValue: 3540,
      status: 'ACTIVE',
      lines: {
        create: [
          { productId: products[2].id, quantity: 1, unitPrice: 2000, lineTotal: 2000 },
          { productId: products[4].id, quantity: 1, unitPrice: 1000, lineTotal: 1000 },
        ],
      },
    },
  });

  // Draft invoice pending confirmation
  const inv6 = await prisma.invoice.create({
    data: {
      invoiceNumber: nextInvNumber(),
      customerId: customers[1].id,
      subscriptionId: sub6.id,
      dueDate: daysFromNow(15),
      billingPeriodStart: monthsAgo(1),
      billingPeriodEnd: new Date(),
      subtotal: 3000,
      taxAmount: 540,
      grandTotal: 3540,
      amountPaid: 0,
      outstandingBalance: 3540,
      status: 'DRAFT',
      lines: {
        create: [
          { productId: products[2].id, productNameSnapshot: 'HR Module', unitPriceSnapshot: 2000, quantity: 1, taxRate: 18, taxAmount: 360, lineSubtotal: 2000, lineTotal: 2360 },
          { productId: products[4].id, productNameSnapshot: 'Analytics Plus', unitPriceSnapshot: 1000, quantity: 1, taxRate: 18, taxAmount: 180, lineSubtotal: 1000, lineTotal: 1180 },
        ],
      },
    },
  });

  // ── QUOTATION: Draft (Amit - Enterprise plan quote) ───────────────────────
  await prisma.quotation.create({
    data: {
      quotationNumber: nextQuoNumber(),
      customerId: customers[2].id,
      planId: plans[3].id,
      templateId: template3.id,
      createdByUserId: staff1User.id,
      expiryDate: daysFromNow(45),
      paymentTerms: 'Net 45',
      subtotal: 16300,
      taxAmount: 2934,
      grandTotal: 19234,
      status: 'DRAFT',
      lines: {
        create: [
          { productId: products[0].id, variantId: odooEnterprise.id, quantity: 1, unitPrice: 7500, lineTotal: 7500 },
          { productId: products[1].id, variantId: crmPro.id, quantity: 1, unitPrice: 4500, lineTotal: 4500 },
          { productId: products[2].id, quantity: 1, unitPrice: 2800, lineTotal: 2800 },
          { productId: products[4].id, quantity: 1, unitPrice: 1500, lineTotal: 1500 },
        ],
      },
    },
  });

  // ── SUBSCRIPTION 7: Active (Rajesh - Yearly) ─────────────────────────────
  const sub7 = await prisma.subscription.create({
    data: {
      subscriptionNumber: nextSubNumber(),
      customerId: customers[0].id,
      planId: plans[2].id,
      createdByUserId: staff2User.id,
      startDate: monthsAgo(2),
      nextBillingDate: daysFromNow(300),
      paymentTerms: 'Net 30',
      monthlyValue: 59000,
      status: 'ACTIVE',
      lines: {
        create: [
          { productId: products[0].id, variantId: odooCommunity.id, quantity: 1, unitPrice: 5000, lineTotal: 5000 },
          { productId: products[2].id, quantity: 1, unitPrice: 2000, lineTotal: 2000 },
        ],
      },
    },
  });

  const inv7 = await prisma.invoice.create({
    data: {
      invoiceNumber: nextInvNumber(),
      customerId: customers[0].id,
      subscriptionId: sub7.id,
      dueDate: daysFromNow(-15),
      billingPeriodStart: monthsAgo(2),
      billingPeriodEnd: daysFromNow(300),
      subtotal: 50000,
      discountAmount: 5000,
      taxAmount: 8100,
      grandTotal: 53100,
      amountPaid: 53100,
      outstandingBalance: 0,
      status: 'PAID',
      lines: {
        create: [
          { productId: products[0].id, variantId: odooCommunity.id, productNameSnapshot: 'Odoo ERP', variantNameSnapshot: 'Community Edition', unitPriceSnapshot: 5000, quantity: 1, discountAmount: 3000, taxRate: 18, taxAmount: 720, lineSubtotal: 5000, lineTotal: 3720 },
          { productId: products[2].id, productNameSnapshot: 'HR Module', unitPriceSnapshot: 2000, quantity: 1, discountAmount: 2000, taxRate: 18, taxAmount: 0, lineSubtotal: 2000, lineTotal: 0 },
        ],
      },
    },
  });
  await prisma.payment.create({
    data: {
      invoiceId: inv7.id, customerId: customers[0].id, recordedByUserId: staff1User.id,
      paymentMethod: 'BANK_TRANSFER', amount: 53100, paymentDate: monthsAgo(2),
      transactionReference: 'NEFT-YLY-001',
    },
  });

  console.log('  ✅ Subscriptions, invoices, and payments created');

  // ─────────────────────────────────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      { userId: adminUser.id, title: 'New Subscription', message: 'SUB-2025-000001 activated for Rajesh Kumar', eventType: 'NEW_SUBSCRIPTION', entityType: 'Subscription', entityId: sub1.id, isRead: true },
      { userId: adminUser.id, title: 'Payment Received', message: '₹14,160 payment recorded for INV-2025-000001', eventType: 'PAYMENT_RECORDED', entityType: 'Invoice', entityId: inv1.id, isRead: false },
      { userId: adminUser.id, title: 'Invoice Overdue', message: 'INV-2025-000005 is overdue — ₹5,900 outstanding', eventType: 'INVOICE_OVERDUE', entityType: 'Invoice', entityId: inv5.id, isRead: false },
      { userId: staff1User.id, title: 'Subscription Paused', message: 'SUB-2025-000003 (Amit Patel) has been paused', eventType: 'SUBSCRIPTION_PAUSED', entityType: 'Subscription', entityId: sub3.id, isRead: false },
    ],
  });

  console.log('  ✅ Notifications created');

  // ─────────────────────────────────────────────────────────────────────────
  // AUDIT LOGS
  // ─────────────────────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: adminUser.id, action: 'CUSTOMER_CREATED', entityType: 'Customer', entityId: customers[0].id, changeDetails: { name: 'Rajesh Kumar' } },
      { userId: staff1User.id, action: 'QUOTATION_CONFIRMED', entityType: 'Quotation', entityId: quo1.id, changeDetails: { status: 'CONFIRMED' } },
      { userId: staff1User.id, action: 'SUBSCRIPTION_CREATED', entityType: 'Subscription', entityId: sub1.id },
      { userId: staff1User.id, action: 'PAYMENT_RECORDED', entityType: 'Invoice', entityId: inv1.id, changeDetails: { amount: 14160 } },
      { userId: staff2User.id, action: 'SUBSCRIPTION_PAUSED', entityType: 'Subscription', entityId: sub3.id },
    ],
  });

  console.log('  ✅ Audit logs created');

  console.log('\n✅ Seed complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('  Admin:      admin@brightloop.com   / Admin@123!');
  console.log('  Staff 1:    staff1@brightloop.com  / Staff@123!');
  console.log('  Staff 2:    staff2@brightloop.com  / Staff@123!');
  console.log('  Customer 1: customer1@example.com  / Customer@123!  (Rajesh Kumar)');
  console.log('  Customer 2: customer2@example.com  / Customer@123!  (Priya Sharma)');
  console.log('  Customer 3: customer3@example.com  / Customer@123!  (Amit Patel)');
  console.log('  Customer 4: customer4@example.com  / Customer@123!  (Sunita Reddy)');
  console.log('  Customer 5: customer5@example.com  / Customer@123!  (Vikram Singh)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


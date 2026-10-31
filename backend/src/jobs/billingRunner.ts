import { prisma } from '../config/database';
import { calculateNextBillingDate, calculateBillingPeriodEnd, generateInvoiceNumber } from '../utils/dateUtils';
import { Decimal } from '../utils/currencyUtils';
import { socketEvents } from '../config/socket';
import { notifyStaff } from '../utils/notificationService';
import { v4 as uuidv4 } from 'uuid';

export async function runBillingJob(triggeredBy: string = 'SCHEDULER'): Promise<{
  jobId: string;
  subscriptionsProcessed: number;
  invoicesCreated: number;
  failures: number;
  details: string[];
}> {
  const jobId = `JOB-${Date.now()}-${uuidv4().substring(0, 8)}`;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  console.log(`\n⏳ [Billing] Starting billing run ${jobId} (Triggered by: ${triggeredBy})...`);

  // Try to acquire PostgreSQL advisory lock to ensure only one run executes at a time
  let hasLock = true;
  try {
    const lockResult: any = await prisma.$queryRawUnsafe(`SELECT pg_try_advisory_lock(987654321) as locked;`);
    hasLock = lockResult?.[0]?.locked === true;
  } catch (err) {
    // If running in an environment where advisory locks aren't supported (e.g. mock DB), proceed with log
    hasLock = true;
  }

  if (!hasLock) {
    console.log(`⚠️ [Billing] Another billing job is already in progress. Skipping run ${jobId}.`);
    return {
      jobId,
      subscriptionsProcessed: 0,
      invoicesCreated: 0,
      failures: 0,
      details: ['Skipped: concurrent billing job active'],
    };
  }

  const jobLog = await prisma.billingJobLog.create({
    data: {
      jobId,
      billingDate: today,
      status: 'RUNNING',
    },
  });

  let processedCount = 0;
  let createdCount = 0;
  let failCount = 0;
  const executionLogs: string[] = [];

  try {
    // 1. Fetch eligible active subscriptions whose next billing date is on or before today
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: { lte: now },
      },
      include: {
        customer: true,
        plan: true,
        lines: { include: { product: true, variant: true } },
      },
    });

    console.log(`[Billing] Found ${subscriptions.length} active subscription(s) due for billing.`);

    // Pre-fetch active tax rules
    const activeTaxes = await prisma.taxRule.findMany({
      where: { isActive: true },
      include: { taxRuleProducts: true },
    });

    for (const sub of subscriptions) {
      processedCount++;
      const billingPeriodStart = sub.nextBillingDate;
      const billingPeriodEnd = calculateBillingPeriodEnd(
        calculateNextBillingDate(billingPeriodStart, sub.plan.billingInterval)
      );

      try {
        // Idempotency check: see if an invoice for this period already exists
        const existingInvoice = await prisma.invoice.findFirst({
          where: {
            subscriptionId: sub.id,
            billingPeriodStart,
          },
        });

        if (existingInvoice) {
          executionLogs.push(`Sub ${sub.subscriptionNumber}: Invoice already exists for period ${billingPeriodStart.toISOString().split('T')[0]}. Skipped.`);
          // Still advance billing date if it was stuck
          const nextDate = calculateNextBillingDate(sub.nextBillingDate, sub.plan.billingInterval);
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { nextBillingDate: nextDate },
          });
          continue;
        }

        // Process this subscription inside a transaction
        await prisma.$transaction(async (tx) => {
          let subtotal = new Decimal(0);
          let totalTax = new Decimal(0);
          let totalDiscount = new Decimal(0);

          // Prepare invoice lines
          const invoiceLinesData = [];

          for (const line of sub.lines) {
            const unitPrice = new Decimal(line.unitPrice.toString());
            const lineSubtotal = unitPrice.times(line.quantity);
            subtotal = subtotal.plus(lineSubtotal);

            // Find applicable tax rules
            let lineTaxRate = new Decimal(0);
            let lineTaxAmount = new Decimal(0);

            const applicableTax = activeTaxes.find(
              (t) => t.appliesToAll || t.taxRuleProducts.some((p) => p.productId === line.productId)
            );

            if (applicableTax) {
              if (applicableTax.taxType === 'PERCENTAGE') {
                lineTaxRate = new Decimal(applicableTax.percentage.toString());
                lineTaxAmount = lineSubtotal.times(lineTaxRate).dividedBy(100);
              } else {
                lineTaxAmount = new Decimal(applicableTax.fixedAmount.toString());
              }
            }

            totalTax = totalTax.plus(lineTaxAmount);
            const lineTotal = lineSubtotal.plus(lineTaxAmount);

            invoiceLinesData.push({
              productId: line.productId,
              variantId: line.variantId,
              productNameSnapshot: line.product.name,
              variantNameSnapshot: line.variant?.name || null,
              unitPriceSnapshot: unitPrice.toNumber(),
              quantity: line.quantity,
              discountAmount: 0,
              taxRate: lineTaxRate.toNumber(),
              taxAmount: lineTaxAmount.toNumber(),
              lineSubtotal: lineSubtotal.toNumber(),
              lineTotal: lineTotal.toNumber(),
            });
          }

          // Check for active subscription-wide discounts
          const activeDiscounts = await tx.discount.findMany({
            where: {
              isActive: true,
              isSubscriptionWide: true,
              OR: [
                { startDate: null, endDate: null },
                { startDate: { lte: now }, endDate: { gte: now } },
              ],
            },
          });

          for (const disc of activeDiscounts) {
            if (disc.maxUsageCount !== null && disc.usageCount >= disc.maxUsageCount) continue;
            if (subtotal.lessThan(new Decimal(disc.minimumAmount.toString()))) continue;

            let discAmount = new Decimal(0);
            if (disc.discountType === 'PERCENTAGE') {
              discAmount = subtotal.times(new Decimal(disc.value.toString())).dividedBy(100);
            } else {
              discAmount = new Decimal(disc.value.toString());
            }

            if (discAmount.greaterThan(subtotal)) discAmount = subtotal;
            totalDiscount = totalDiscount.plus(discAmount);

            // Record discount usage
            await tx.discount.update({
              where: { id: disc.id },
              data: { usageCount: { increment: 1 } },
            });
            break; // Apply best single subscription-wide discount
          }

          const grandTotal = Decimal.max(0, subtotal.minus(totalDiscount).plus(totalTax));

          // Generate sequential invoice number
          const invoiceCount = await tx.invoice.count();
          const invoiceNumber = generateInvoiceNumber(invoiceCount + 1);

          const dueDate = new Date(billingPeriodStart);
          dueDate.setDate(dueDate.getDate() + 15); // Net 15 standard

          const createdInvoice = await tx.invoice.create({
            data: {
              invoiceNumber,
              customerId: sub.customerId,
              subscriptionId: sub.id,
              invoiceDate: billingPeriodStart,
              dueDate,
              billingPeriodStart,
              billingPeriodEnd,
              subtotal: subtotal.toNumber(),
              discountAmount: totalDiscount.toNumber(),
              taxAmount: totalTax.toNumber(),
              grandTotal: grandTotal.toNumber(),
              amountPaid: 0,
              outstandingBalance: grandTotal.toNumber(),
              status: 'CONFIRMED',
              billingJobId: jobId,
              lines: { create: invoiceLinesData },
            },
          });

          // Calculate next billing date
          const nextDate = calculateNextBillingDate(sub.nextBillingDate, sub.plan.billingInterval);

          // Check auto-close criteria: if plan has availability end or sub has endDate
          const shouldClose =
            (sub.plan.autoClose && sub.plan.availableTo && nextDate > new Date(sub.plan.availableTo)) ||
            (sub.endDate && nextDate > new Date(sub.endDate));

          await tx.subscription.update({
            where: { id: sub.id },
            data: {
              nextBillingDate: nextDate,
              status: shouldClose ? 'CLOSED' : 'ACTIVE',
              closedAt: shouldClose ? now : null,
              closeReason: shouldClose ? 'Configured plan end date reached' : null,
            },
          });

          createdCount++;
          executionLogs.push(`Sub ${sub.subscriptionNumber}: Generated invoice ${invoiceNumber} for ₹${grandTotal.toFixed(2)}.`);

          // Emit notification event
          socketEvents.emitToStaff('invoice:generated', createdInvoice);
        });
      } catch (subErr: any) {
        failCount++;
        const msg = `Sub ${sub.subscriptionNumber} billing error: ${subErr.message}`;
        console.error(msg, subErr);
        executionLogs.push(msg);
      }
    }

    const finalStatus = failCount === 0 ? 'COMPLETED' : createdCount > 0 ? 'PARTIAL_FAILURE' : 'FAILED';

    await prisma.billingJobLog.update({
      where: { id: jobLog.id },
      data: {
        subscriptionsProcessed: processedCount,
        invoicesCreated: createdCount,
        failures: failCount,
        errorDetails: executionLogs,
        status: finalStatus,
        completedAt: new Date(),
      },
    });

    console.log(`✅ [Billing] Job ${jobId} completed: ${createdCount} invoice(s) generated, ${failCount} failed.\n`);

    if (createdCount > 0) {
      await notifyStaff({
        title: 'Billing Run Completed',
        message: `Generated ${createdCount} invoices automatically during billing run.`,
        eventType: 'INVOICE_GENERATED',
      });
      socketEvents.emitDashboardRefresh();
    }

    return {
      jobId,
      subscriptionsProcessed: processedCount,
      invoicesCreated: createdCount,
      failures: failCount,
      details: executionLogs,
    };
  } finally {
    // Release advisory lock
    try {
      await prisma.$queryRawUnsafe(`SELECT pg_advisory_unlock(987654321);`);
    } catch {
      // Ignored if unsupported
    }
  }
}


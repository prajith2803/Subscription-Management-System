import cron from 'node-cron';
import { env } from '../config/env';
import { runBillingJob } from './billingRunner';

let billingTask: cron.ScheduledTask | null = null;

export function startBillingScheduler(): void {
  const cronExpr = env.BILLING_CRON || '0 1 * * *';

  if (!cron.validate(cronExpr)) {
    console.error(`❌ Invalid cron expression: "${cronExpr}". Billing scheduler not started.`);
    return;
  }

  billingTask = cron.schedule(cronExpr, async () => {
    try {
      await runBillingJob('SCHEDULED_CRON');
    } catch (err) {
      console.error('❌ Error executing scheduled billing job:', err);
    }
  });

  console.log(`⏰ Recurring billing scheduler scheduled with cron: "${cronExpr}"`);
}

export function stopBillingScheduler(): void {
  if (billingTask) {
    billingTask.stop();
    console.log('Billing scheduler stopped.');
  }
}


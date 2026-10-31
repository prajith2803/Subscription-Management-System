# Database Design & Schema Specifications
## Brightloop Software – Subscription Management System

### 1. Key Database Entities

1. **Users & Customers**
   - `users`: Core identity table with credentials, roles (`ADMIN`, `STAFF`, `CUSTOMER`), and active status.
   - `customers`: Profile information linked 1:1 with users who hold the `CUSTOMER` role. Stores billing contact details and tax IDs.

2. **Products & Variants**
   - `products`: Software, services, and add-ons with base sales and cost prices.
   - `product_variants`: Product editions (e.g., Enterprise, Multi-Warehouse) with additive pricing.

3. **Plans & Quotations**
   - `plans`: Configurable recurring billing tiers (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`) with pause, renewal, and auto-close policies.
   - `quotations`: Commercial proposals with expiration dates, payment terms, and calculated lines. Confirmation transitions quotations into active subscriptions.

4. **Subscriptions & Billing**
   - `subscriptions`: Master active contract tracking start date, next billing date, monthly value, and lifecycle status.
   - `invoices`: Formal billing records with billing period boundaries, subtotal, discounts, tax snapshot, grand total, and outstanding balance.
   - `unique_invoice_per_billing_period`: Unique index on `(subscriptionId, billingPeriodStart)` to guarantee strict billing idempotency.

5. **Payments & Reconciliation**
   - `payments`: Individual settlement transactions linked to invoices. Supports partial payments and updates invoice balances within atomic transactions.

6. **Taxes & Discounts**
   - `tax_rules`: Configurable percentage or fixed amount tax definitions. Applied rates and calculated amounts are stored as permanent snapshots on invoice lines.
   - `discounts`: Promotional vouchers with validation thresholds, start/end date constraints, and maximum usage quotas.

7. **System & Auditing**
   - `audit_logs`: Immutable security records tracking mutations, administrative actions, and actor IP addresses.
   - `billing_job_logs`: Execution records of recurring billing runs with processed counts and error details.


# Automated Testing Suite & Verification Guide
## Brightloop Software – Subscription Management System

### Test Coverage Areas

1. **Authentication & Access Control**
   - Unique email constraints
   - Strong password regex validation
   - Role-based route guard enforcement
   - Tenant data isolation between customers

2. **Pricing & Currency Engine**
   - Precise decimal addition and subtraction without binary floating point discrepancies
   - Variant-adjusted pricing (`salesPrice + additionalPrice`)
   - 18% GST and fixed tax calculations with half-up rounding
   - Discount thresholds, ceilings, and non-negative total enforcement

3. **Recurring Billing & Idempotency**
   - Calculation of next billing dates across `DAILY`, `WEEKLY`, `MONTHLY`, and `YEARLY` intervals
   - Month-end edge cases (e.g., January 31 -> February 28/29)
   - Composite unique key prevention against duplicate invoice generation for identical billing periods

4. **Payment Reconciliation**
   - Partial payment calculation and status transitions (`CONFIRMED` -> `PARTIALLY_PAID` -> `PAID`)
   - Rejection of payments exceeding outstanding balance
   - Real-time event broadcasting on balance settlement

### Running Tests
- Backend Test Suite:
  ```bash
  cd backend
  npm test
  ```
- Frontend Test Suite:
  ```bash
  cd frontend
  npm test
  ```


# Architecture Documentation
## Brightloop Software – Subscription Management System

### 1. High-Level System Architecture

Brightloop Software Subscription Management System is built on a modern, decoupled client-server architecture designed for high availability, transaction safety, and role-based access control.

```
+-------------------------------------------------------------+
|                      Frontend Layer                         |
|     React 18 + TypeScript + Vite + Tailwind CSS             |
|   +--------------------------+  +------------------------+  |
|   |   Customer Portal        |  |  Staff / Admin Console |  |
|   +--------------------------+  +------------------------+  |
|                   |                             |           |
+-------------------|-----------------------------|-----------+
                    | HTTPS REST / WebSocket      |
+-------------------|-----------------------------|-----------+
|                   v                             v           |
|                      Backend API Layer                      |
|                  Node.js + Express + TypeScript             |
|   +-----------------------------------------------------+   |
|   |  Middlewares (Helmet, CORS, RateLimit, Auth, RBAC)  |   |
|   +-----------------------------------------------------+   |
|   |  Modules: Auth, Products, Plans, Quotations,        |   |
|   |  Subscriptions, Invoices, Payments, Taxes, Discounts|   |
|   +-----------------------------------------------------+   |
|   |  Background Scheduler (node-cron + advisory lock)   |   |
|   +-----------------------------------------------------+   |
|   |  Real-Time Socket.IO Server (Role-based rooms)      |   |
|   +-----------------------------------------------------+   |
|                              |                              |
|                              v                              |
|                    Prisma ORM (v5)                          |
+------------------------------|------------------------------+
                               |
+------------------------------v------------------------------+
|                      Database Layer                         |
|                       PostgreSQL 16                         |
|   +-----------------------------------------------------+   |
|   |  22 Relational Tables with Composite Unique Keys    |   |
|   |  Financial Columns: NUMERIC(15,2)                   |   |
+-------------------------------------------------------------+
```

### 2. Security Architecture
- **Authentication**: JWT stored exclusively in secure, `HTTP-only`, `SameSite=Strict` cookies. Tokens are inaccessible to client-side scripts, protecting against XSS token extraction.
- **Password Protection**: Passwords hashed using `bcrypt` with work factor 12. Password policy enforces minimum 8 characters, uppercase, lowercase, and special characters.
- **Tenant Data Isolation**: The Customer Portal enforces row-level data isolation at the middleware and service layers. Customer users can only query and mutate records where `customerId == req.user.customerId`.
- **Concurrency & Idempotency**: PostgreSQL advisory locks ensure that concurrent scheduled billing triggers do not generate duplicate invoices. The `invoices` table enforces a composite unique constraint on `(subscriptionId, billingPeriodStart)`.
- **Financial Arithmetic**: Floating-point numbers are prohibited for financial calculations. Calculations utilize `decimal.js` and PostgreSQL `NUMERIC(15,2)` with standard half-up rounding.


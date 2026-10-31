# Brightloop Software – Subscription Management System
> Hackathon-grade full-stack subscription lifecycle and recurring billing platform.

---

## 🌟 Overview

Brightloop Software sells enterprise and SMB software subscriptions through monthly, yearly, and custom billing models with variants, add-ons, and tax/discount engines. This system automates the entire subscription lifecycle:

1. **Customer Registration & Role-Based Access Control**:
   - `ADMIN`: Full system access, staff provisioning, tax & discount management, system auditing, manual billing run.
   - `STAFF`: Operational console for customer onboarding, quotations, subscription lifecycle, and manual payment reconciliation.
   - `CUSTOMER`: Self-service portal with strict tenant isolation, invoice downloading, payment history, and profile management.
2. **Catalog & Quotations**:
   - Software products and variants with additive pricing (e.g., Base + Enterprise Edition).
   - Commercial quotations with validities and payment terms, automatically convertible into active subscriptions.
3. **Automated Recurring Billing Scheduler**:
   - Background `node-cron` billing engine with PostgreSQL advisory locking to prevent race conditions.
   - Automatic invoice generation with idempotency via composite unique constraints `[subscriptionId, billingPeriodStart]`.
   - Snapshot preservation for tax rates, discounts, and variant prices at billing time.
4. **Invoice & Payment Reconciliation**:
   - Professional server-side PDF invoice generation with itemized taxes, discounts, and balances.
   - Atomic multi-payment tracking (`PARTIALLY_PAID` -> `PAID`) with balance validation.
5. **Real-Time & Analytics**:
   - Live Socket.IO event distribution to staff and customer rooms.
   - Financial analytics dashboards featuring cash revenue, outstanding receivables, and interactive Recharts visualizations.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router v6, Lucide Icons, Recharts
- **Backend**: Node.js, Express.js, TypeScript, Prisma ORM, Zod, bcrypt, JWT (HTTP-only cookies), PDFKit, Node-Cron, Nodemailer
- **Database**: PostgreSQL 16 (relational schema with 22 models and `NUMERIC(15,2)` decimal currency precision)
- **Real-Time**: Socket.IO

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@brightloop.com` | `Admin@123!` | Full control, staff provisioning, audit logs |
| **Staff 1** | `staff1@brightloop.com` | `Staff@123!` | Operational dashboard, quotes, payments |
| **Staff 2** | `staff2@brightloop.com` | `Staff@123!` | Operational dashboard, quotes, payments |
| **Customer 1** | `customer1@example.com` | `Customer@123!` | Rajesh Kumar (TechVentures Pvt Ltd) |
| **Customer 2** | `customer2@example.com` | `Customer@123!` | Priya Sharma (InnovateSoft) |
| **Customer 3** | `customer3@example.com` | `Customer@123!` | Amit Patel (Digital Solutions Ltd) |
| **Customer 4** | `customer4@example.com` | `Customer@123!` | Sunita Reddy (SmartBiz Corp) |
| **Customer 5** | `customer5@example.com` | `Customer@123!` | Vikram Singh (FutureTech Systems) |

---

## 🚀 Getting Started

### 1. Database Setup
Start the local PostgreSQL container:
```bash
docker compose up -d
```

### 2. Backend Setup
Navigate to the backend directory, install dependencies, run migrations and seed data:
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```
The backend API server will listen on `http://localhost:3000`.

### 3. Frontend Setup
In a separate terminal, start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
The application will be accessible at `http://localhost:5173`.

---

## 🧪 Running Automated Tests

Run the backend test suite:
```bash
cd backend
npm test
```

Run the frontend test suite:
```bash
cd frontend
npm test
```

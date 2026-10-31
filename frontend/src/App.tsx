import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Layouts
import { AuthLayout } from './layouts/AuthLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { CustomerLayout } from './layouts/CustomerLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Admin / Staff Pages
import { DashboardPage } from './pages/admin/DashboardPage';
import { CustomersPage } from './pages/admin/CustomersPage';
import { CustomerDetailPage } from './pages/admin/CustomerDetailPage';
import { ProductsPage } from './pages/admin/ProductsPage';
import { PlansPage } from './pages/admin/PlansPage';
import { QuotationsPage } from './pages/admin/QuotationsPage';
import { SubscriptionsPage } from './pages/admin/SubscriptionsPage';
import { SubscriptionDetailPage } from './pages/admin/SubscriptionDetailPage';
import { InvoicesPage } from './pages/admin/InvoicesPage';
import { InvoiceDetailPage } from './pages/admin/InvoiceDetailPage';
import { PaymentsPage } from './pages/admin/PaymentsPage';
import { TaxesPage } from './pages/admin/TaxesPage';
import { DiscountsPage } from './pages/admin/DiscountsPage';
import { StaffPage } from './pages/admin/StaffPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';

// Customer Portal Pages
import { PortalDashboardPage } from './pages/customer/PortalDashboardPage';
import { PortalSubscriptionsPage } from './pages/customer/PortalSubscriptionsPage';
import { PortalInvoicesPage } from './pages/customer/PortalInvoicesPage';
import { PortalPaymentsPage } from './pages/customer/PortalPaymentsPage';
import { PortalProfilePage } from './pages/customer/PortalProfilePage';

export const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={user.role === 'CUSTOMER' ? '/portal' : '/dashboard'} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Auth Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Route>

      {/* Admin / Staff Protected Routes */}
      <Route element={<AdminLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/quotations" element={<QuotationsPage />} />
        <Route path="/subscriptions" element={<SubscriptionsPage />} />
        <Route path="/subscriptions/:id" element={<SubscriptionDetailPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/taxes" element={<TaxesPage />} />
        <Route path="/discounts" element={<DiscountsPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
      </Route>

      {/* Customer Portal Protected Routes */}
      <Route element={<CustomerLayout />}>
        <Route path="/portal" element={<PortalDashboardPage />} />
        <Route path="/portal/subscriptions" element={<PortalSubscriptionsPage />} />
        <Route path="/portal/invoices" element={<PortalInvoicesPage />} />
        <Route path="/portal/payments" element={<PortalPaymentsPage />} />
        <Route path="/portal/profile" element={<PortalProfilePage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;


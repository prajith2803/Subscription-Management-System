import axios from 'axios';
import type {
  AuthUser,
  Customer,
  Product,
  Plan,
  Quotation,
  Subscription,
  Invoice,
  Payment,
  TaxRule,
  Discount,
  Notification,
  AuditLog,
  DashboardKPIs,
  PaginatedResponse,
} from '../types';

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login')) {
      // Session expired, redirect to login
      if (window.location.pathname !== '/register' && window.location.pathname !== '/forgot-password') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: any) => api.post('/auth/register', data).then((r) => r.data),
  login: (data: any) => api.post('/auth/login', data).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  getMe: (): Promise<AuthUser> => api.get('/auth/me').then((r) => r.data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token: string, password: string) => api.post(`/auth/reset-password/${token}`, { password }).then((r) => r.data),
};

export const usersApi = {
  list: (params?: any): Promise<PaginatedResponse<any>> => api.get('/users', { params }).then((r) => r.data),
  createStaff: (data: any) => api.post('/users', data).then((r) => r.data),
  deactivate: (id: string) => api.delete(`/users/${id}/deactivate`).then((r) => r.data),
};

export const customersApi = {
  list: (params?: any): Promise<PaginatedResponse<Customer>> => api.get('/customers', { params }).then((r) => r.data),
  getById: (id: string): Promise<Customer> => api.get(`/customers/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/customers', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/customers/${id}`, data).then((r) => r.data),
};

export const productsApi = {
  list: (params?: any): Promise<PaginatedResponse<Product>> => api.get('/products', { params }).then((r) => r.data),
  getById: (id: string): Promise<Product> => api.get(`/products/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/products', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/products/${id}`, data).then((r) => r.data),
  addVariant: (productId: string, data: any) => api.post(`/products/${productId}/variants`, data).then((r) => r.data),
  updateVariant: (productId: string, variantId: string, data: any) => api.patch(`/products/${productId}/variants/${variantId}`, data).then((r) => r.data),
};

export const plansApi = {
  list: (params?: any): Promise<PaginatedResponse<Plan>> => api.get('/plans', { params }).then((r) => r.data),
  getById: (id: string): Promise<Plan> => api.get(`/plans/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/plans', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/plans/${id}`, data).then((r) => r.data),
  addProduct: (planId: string, data: any) => api.post(`/plans/${planId}/products`, data).then((r) => r.data),
  removeProduct: (planId: string, planProductId: string) => api.delete(`/plans/${planId}/products/${planProductId}`).then((r) => r.data),
};

export const quotationsApi = {
  list: (params?: any): Promise<PaginatedResponse<Quotation>> => api.get('/quotations', { params }).then((r) => r.data),
  getById: (id: string): Promise<Quotation> => api.get(`/quotations/${id}`).then((r) => r.data),
  create: (data: any) => api.post('/quotations', data).then((r) => r.data),
  confirm: (id: string) => api.post(`/quotations/${id}/confirm`).then((r) => r.data),
  cancel: (id: string) => api.post(`/quotations/${id}/cancel`).then((r) => r.data),
};

export const quotationTemplatesApi = {
  list: (): Promise<any[]> => api.get('/quotation-templates').then((r) => r.data),
  create: (data: any) => api.post('/quotation-templates', data).then((r) => r.data),
};

export const subscriptionsApi = {
  list: (params?: any): Promise<PaginatedResponse<Subscription>> => api.get('/subscriptions', { params }).then((r) => r.data),
  getById: (id: string): Promise<Subscription> => api.get(`/subscriptions/${id}`).then((r) => r.data),
  pause: (id: string) => api.post(`/subscriptions/${id}/pause`).then((r) => r.data),
  resume: (id: string) => api.post(`/subscriptions/${id}/resume`).then((r) => r.data),
  close: (id: string, reason?: string) => api.post(`/subscriptions/${id}/close`, { reason }).then((r) => r.data),
  renew: (id: string) => api.post(`/subscriptions/${id}/renew`).then((r) => r.data),
};

export const invoicesApi = {
  list: (params?: any): Promise<PaginatedResponse<Invoice>> => api.get('/invoices', { params }).then((r) => r.data),
  getById: (id: string): Promise<Invoice> => api.get(`/invoices/${id}`).then((r) => r.data),
  confirm: (id: string) => api.post(`/invoices/${id}/confirm`).then((r) => r.data),
  cancel: (id: string) => api.post(`/invoices/${id}/cancel`).then((r) => r.data),
  downloadPdf: (id: string) =>
    api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }),
};

export const paymentsApi = {
  list: (params?: any): Promise<PaginatedResponse<Payment>> => api.get('/payments', { params }).then((r) => r.data),
  record: (data: any) => api.post('/payments', data).then((r) => r.data),
  getById: (id: string): Promise<Payment> => api.get(`/payments/${id}`).then((r) => r.data),
};

export const taxesApi = {
  list: (params?: any): Promise<PaginatedResponse<TaxRule>> => api.get('/taxes', { params }).then((r) => r.data),
  create: (data: any) => api.post('/taxes', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/taxes/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/taxes/${id}`).then((r) => r.data),
};

export const discountsApi = {
  list: (params?: any): Promise<PaginatedResponse<Discount>> => api.get('/discounts', { params }).then((r) => r.data),
  create: (data: any) => api.post('/discounts', data).then((r) => r.data),
  update: (id: string, data: any) => api.patch(`/discounts/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/discounts/${id}`).then((r) => r.data),
  checkEligibility: (id: string, params: any) => api.get(`/discounts/${id}/eligibility`, { params }).then((r) => r.data),
};

export const billingApi = {
  run: () => api.post('/billing/run').then((r) => r.data),
  getLogs: (params?: any): Promise<PaginatedResponse<any>> => api.get('/billing/logs', { params }).then((r) => r.data),
};

export const dashboardApi = {
  getKPIs: (): Promise<DashboardKPIs> => api.get('/dashboard/kpis').then((r) => r.data),
  getCharts: (): Promise<any> => api.get('/dashboard/charts').then((r) => r.data),
};

export const notificationsApi = {
  list: (params?: any): Promise<PaginatedResponse<Notification> & { unreadCount: number }> => api.get('/notifications', { params }).then((r) => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  readAll: () => api.patch('/notifications/read-all').then((r) => r.data),
};

export const auditLogsApi = {
  list: (params?: any): Promise<PaginatedResponse<AuditLog>> => api.get('/audit-logs', { params }).then((r) => r.data),
};

export const portalApi = {
  getDashboard: () => api.get('/portal/dashboard').then((r) => r.data),
  getSubscriptions: (): Promise<Subscription[]> => api.get('/portal/subscriptions').then((r) => r.data),
  getSubscriptionById: (id: string): Promise<Subscription> => api.get(`/portal/subscriptions/${id}`).then((r) => r.data),
  getInvoices: (params?: any): Promise<PaginatedResponse<Invoice>> => api.get('/portal/invoices', { params }).then((r) => r.data),
  getInvoiceById: (id: string): Promise<Invoice> => api.get(`/portal/invoices/${id}`).then((r) => r.data),
  downloadInvoicePdf: (id: string) =>
    api.get(`/portal/invoices/${id}/pdf`, { responseType: 'blob' }).then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }),
  getPayments: (): Promise<Payment[]> => api.get('/portal/payments').then((r) => r.data),
  getProfile: (): Promise<Customer> => api.get('/portal/profile').then((r) => r.data),
  updateProfile: (data: any) => api.patch('/portal/profile', data).then((r) => r.data),
};


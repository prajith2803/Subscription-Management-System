import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/api';
import { KPICard } from '../../components/ui/KPICard';
import { Card } from '../../components/ui/Card';
import { formatCurrency } from '../../utils';
import {
  Users,
  Repeat,
  Receipt,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  FileCheck,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: dashboardApi.getKPIs,
    refetchInterval: 30000,
  });

  const { data: charts, isLoading: chartsLoading } = useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: dashboardApi.getCharts,
  });

  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Executive Overview</h1>
        <p className="text-sm text-slate-500">Live operational & financial metrics from database</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Revenue Received"
          value={formatCurrency(kpis?.totalRevenue)}
          subtitle="Collected payments"
          icon={TrendingUp}
          variant="emerald"
        />
        <KPICard
          title="Outstanding Balance"
          value={formatCurrency(kpis?.outstandingAmount)}
          subtitle="Unpaid invoices"
          icon={Receipt}
          variant="amber"
        />
        <KPICard
          title="Active Subscriptions"
          value={kpis?.activeSubscriptions ?? 0}
          subtitle={`${kpis?.newSubscriptionsThisMonth ?? 0} new this month`}
          icon={Repeat}
          variant="blue"
        />
        <KPICard
          title="Overdue Invoices"
          value={kpis?.overdueInvoicesCount ?? 0}
          subtitle={`Out of ${kpis?.totalInvoices ?? 0} total invoices`}
          icon={AlertTriangle}
          variant="rose"
        />
      </div>

      {/* Secondary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Total Customers</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{kpis?.totalCustomers ?? 0}</p>
          </div>
          <Users className="h-6 w-6 text-slate-400" />
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Total Invoiced Amount</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{formatCurrency(kpis?.totalBilled)}</p>
          </div>
          <FileCheck className="h-6 w-6 text-slate-400" />
        </Card>
        <Card className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold">Total Subscriptions</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{kpis?.totalSubscriptions ?? 0}</p>
          </div>
          <CreditCard className="h-6 w-6 text-slate-400" />
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Area Chart */}
        <Card title="Monthly Revenue vs Billed (Last 12 Months)" description="Cash collected vs Invoiced revenue">
          <div className="h-72 w-full">
            {chartsLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">Loading charts...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts?.monthlyRevenue || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(value: any) => [formatCurrency(value), '']} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="Revenue Collected" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
                  <Area type="monotone" dataKey="billed" name="Billed Amount" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBilled)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Revenue by Plan Bar Chart */}
        <Card title="Revenue By Subscription Plan" description="Distribution of settled revenue across plans">
          <div className="h-72 w-full">
            {chartsLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">Loading charts...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.revenueByPlan || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="plan" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(value: any) => [formatCurrency(value), 'Revenue']} />
                  <Bar dataKey="revenue" name="Revenue" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Status Pie */}
        <Card title="Subscription Status Distribution" description="Current active vs paused vs closed">
          <div className="h-64 w-full">
            {chartsLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">Loading charts...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts?.subscriptionStatusDist || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="status"
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {(charts?.subscriptionStatusDist || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Invoice Status Distribution */}
        <Card title="Invoice Status Breakdown" description="Draft, Confirmed, Paid & Overdue proportions">
          <div className="h-64 w-full">
            {chartsLoading ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">Loading charts...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts?.invoiceStatusDist || []} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis type="category" dataKey="status" stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};


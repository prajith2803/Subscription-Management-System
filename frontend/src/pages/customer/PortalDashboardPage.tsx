import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { portalApi } from '../../services/api';
import { KPICard } from '../../components/ui/KPICard';
import { Card } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { formatCurrency, formatDate } from '../../utils';
import { Repeat, Calendar, Receipt, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export const PortalDashboardPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['portal-dashboard'],
    queryFn: portalApi.getDashboard,
  });

  const handleDownloadPdf = async (id: string) => {
    try {
      toast.loading('Downloading invoice...', { id: 'pdf' });
      await portalApi.downloadInvoicePdf(id);
      toast.success('Invoice downloaded', { id: 'pdf' });
    } catch {
      toast.error('Failed to download invoice', { id: 'pdf' });
    }
  };

  const invoiceColumns: Column<any>[] = [
    {
      header: 'Invoice #',
      cell: (inv) => <span className="font-semibold text-blue-600">{inv.invoiceNumber}</span>,
    },
    {
      header: 'Date',
      cell: (inv) => formatDate(inv.invoiceDate),
    },
    {
      header: 'Amount',
      cell: (inv) => formatCurrency(inv.grandTotal),
    },
    {
      header: 'Outstanding',
      cell: (inv) => (
        <span className={Number(inv.outstandingBalance) > 0 ? 'font-bold text-rose-600' : 'text-slate-500'}>
          {formatCurrency(inv.outstandingBalance)}
        </span>
      ),
    },
    {
      header: 'Status',
      cell: (inv) => <Badge status={inv.status} />,
    },
    {
      header: 'PDF',
      cell: (inv) => (
        <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(inv.id)}>
          <Download className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Customer Portal</h1>
        <p className="text-sm text-slate-500">Manage your active plans, recurring charges and downloaded invoices</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Active Subscriptions"
          value={data?.activeSubscriptions ?? 0}
          icon={Repeat}
          variant="blue"
        />
        <KPICard
          title="Next Recurring Billing"
          value={data?.nextBillingDate ? formatDate(data.nextBillingDate) : '—'}
          subtitle={data?.nextBillingAmount ? `${formatCurrency(data.nextBillingAmount)} for ${data.nextBillingPlan}` : 'No upcoming billing'}
          icon={Calendar}
          variant="emerald"
        />
        <KPICard
          title="Outstanding Balance"
          value={formatCurrency(data?.totalOutstanding)}
          subtitle={Number(data?.totalOutstanding) > 0 ? 'Payment required' : 'All accounts settled'}
          icon={Receipt}
          variant={Number(data?.totalOutstanding) > 0 ? 'rose' : 'slate'}
        />
      </div>

      <Card
        title="Recent Invoices"
        headerAction={
          <Link to="/portal/invoices" className="text-sm font-semibold text-blue-600 hover:text-blue-800">
            View All Invoices →
          </Link>
        }
      >
        <Table
          columns={invoiceColumns}
          data={data?.recentInvoices || []}
          isLoading={isLoading}
          emptyMessage="No invoices generated for your account yet"
        />
      </Card>
    </div>
  );
};


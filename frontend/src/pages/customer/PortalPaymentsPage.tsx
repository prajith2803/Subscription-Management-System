import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { portalApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils';
import { Payment } from '../../types';

export const PortalPaymentsPage: React.FC = () => {
  const { data: payments, isLoading } = useQuery({
    queryKey: ['portal-payments'],
    queryFn: portalApi.getPayments,
  });

  const columns: Column<Payment>[] = [
    {
      header: 'Invoice #',
      cell: (p) => <span className="font-semibold text-blue-600">{p.invoice?.invoiceNumber}</span>,
    },
    {
      header: 'Amount Paid',
      cell: (p) => <span className="font-bold text-emerald-600">{formatCurrency(p.amount)}</span>,
    },
    {
      header: 'Payment Method',
      cell: (p) => p.paymentMethod.replace(/_/g, ' '),
    },
    {
      header: 'Transaction Reference',
      cell: (p) => p.transactionReference || '—',
    },
    {
      header: 'Date',
      cell: (p) => formatDate(p.paymentDate),
    },
    {
      header: 'Status',
      cell: () => <Badge status="PAID" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payment History</h1>
        <p className="text-sm text-slate-500">Record of all payments received and reconciled towards your account</p>
      </div>

      <Card>
        <Table
          columns={columns}
          data={payments || []}
          isLoading={isLoading}
          emptyMessage="No payments recorded for your account yet"
        />
      </Card>
    </div>
  );
};


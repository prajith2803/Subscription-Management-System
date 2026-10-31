import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatCurrency, formatDate } from '../../utils';
import { Payment } from '../../types';

export const PaymentsPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page],
    queryFn: () => paymentsApi.list({ page, limit: 10 }),
  });

  const columns: Column<Payment>[] = [
    {
      header: 'Invoice #',
      cell: (p) => <span className="font-semibold text-blue-600">{p.invoice?.invoiceNumber}</span>,
    },
    {
      header: 'Customer',
      cell: (p) => (
        <div>
          <p className="font-medium text-slate-900">{p.customer?.name}</p>
          <p className="text-xs text-slate-400">{p.customer?.company || ''}</p>
        </div>
      ),
    },
    {
      header: 'Payment Method',
      cell: (p) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {p.paymentMethod.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      header: 'Amount Received',
      cell: (p) => <span className="font-bold text-emerald-600">{formatCurrency(p.amount)}</span>,
    },
    {
      header: 'Reference',
      cell: (p) => p.transactionReference || '—',
    },
    {
      header: 'Recorded Date',
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
        <h1 className="text-2xl font-bold text-slate-900">Payment Reconciliation</h1>
        <p className="text-sm text-slate-500">Audit trail of all settled invoices, bank transfers and cash payments</p>
      </div>

      <Card>
        <Table columns={columns} data={data?.data || []} isLoading={isLoading} />
        <Pagination
          page={page}
          totalPages={data?.totalPages || 1}
          total={data?.total || 0}
          limit={10}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
};


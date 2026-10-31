import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { invoicesApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { formatCurrency, formatDate } from '../../utils';
import { Invoice } from '../../types';
import { Download, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export const InvoicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, statusFilter],
    queryFn: () => invoicesApi.list({ page, limit: 10, status: statusFilter || undefined }),
  });

  const handleDownloadPdf = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      toast.loading('Generating invoice PDF...', { id: 'pdf' });
      await invoicesApi.downloadPdf(id);
      toast.success('Invoice PDF downloaded', { id: 'pdf' });
    } catch {
      toast.error('Failed to download invoice PDF', { id: 'pdf' });
    }
  };

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      cell: (inv) => (
        <span className="font-semibold text-blue-600 flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-blue-500" />
          {inv.invoiceNumber}
        </span>
      ),
    },
    {
      header: 'Customer',
      cell: (inv) => (
        <div>
          <p className="font-medium text-slate-900">{inv.customer?.name}</p>
          <p className="text-xs text-slate-400">{inv.customer?.company || ''}</p>
        </div>
      ),
    },
    {
      header: 'Invoice Date',
      cell: (inv) => formatDate(inv.invoiceDate),
    },
    {
      header: 'Due Date',
      cell: (inv) => formatDate(inv.dueDate),
    },
    {
      header: 'Grand Total',
      cell: (inv) => <span className="font-semibold">{formatCurrency(inv.grandTotal)}</span>,
    },
    {
      header: 'Outstanding',
      cell: (inv) => (
        <span className={Number(inv.outstandingBalance) > 0 ? 'font-semibold text-rose-600' : 'text-slate-500'}>
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
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => handleDownloadPdf(e, inv.id)}
          title="Download PDF Invoice"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices & Billing</h1>
          <p className="text-sm text-slate-500">Track recurring invoices, settlement balances and overdue notices</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          onRowClick={(inv) => navigate(`/invoices/${inv.id}`)}
        />
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


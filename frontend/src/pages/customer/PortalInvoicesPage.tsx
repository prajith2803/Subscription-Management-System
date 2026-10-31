import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { portalApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { formatCurrency, formatDate } from '../../utils';
import { Invoice } from '../../types';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

export const PortalInvoicesPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['portal-invoices', page],
    queryFn: () => portalApi.getInvoices({ page, limit: 10 }),
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

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      cell: (inv) => <span className="font-semibold text-blue-600">{inv.invoiceNumber}</span>,
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
      header: 'Outstanding Balance',
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
      header: 'Download',
      cell: (inv) => (
        <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(inv.id)}>
          <Download className="h-3.5 w-3.5 mr-1" /> PDF
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Invoices</h1>
        <p className="text-sm text-slate-500">Download official tax invoices and review payment receipts</p>
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


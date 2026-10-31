import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationsApi, customersApi, plansApi, productsApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatCurrency, formatDate } from '../../utils';
import { Quotation } from '../../types';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const QuotationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [customerId, setCustomerId] = useState('');
  const [planId, setPlanId] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [validityDays, setValidityDays] = useState('30');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', page],
    queryFn: () => quotationsApi.list({ page, limit: 10 }),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersApi.list({ limit: 100 }),
  });

  const { data: plansData } = useQuery({
    queryKey: ['plans-list'],
    queryFn: () => plansApi.list({ limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productsApi.list({ limit: 100 }),
  });

  const createQuotationMutation = useMutation({
    mutationFn: quotationsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation generated');
      setIsModalOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create quotation'),
  });

  const confirmMutation = useMutation({
    mutationFn: quotationsApi.confirm,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast.success(`Quotation confirmed! Subscription ${res.subscription?.subscriptionNumber || ''} created.`);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to confirm quotation'),
  });

  const cancelMutation = useMutation({
    mutationFn: quotationsApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      toast.success('Quotation cancelled');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to cancel quotation'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const selProd = productsData?.data.find((p) => p.id === productId);
    const unitPrice = selProd ? Number(selProd.salesPrice) : 0;
    const qty = Number(quantity);
    const subtotal = unitPrice * qty;
    const taxAmount = subtotal * 0.18; // standard 18% GST estimate
    const grandTotal = subtotal + taxAmount;

    createQuotationMutation.mutate({
      customerId,
      planId,
      validityDays: Number(validityDays),
      paymentTerms,
      subtotal,
      discountAmount: 0,
      taxAmount,
      grandTotal,
      lines: [
        {
          productId,
          quantity: qty,
          unitPrice,
          discountAmount: 0,
          taxAmount,
          lineTotal: grandTotal,
        },
      ],
    });
  };

  const columns: Column<Quotation>[] = [
    {
      header: 'Quote #',
      cell: (q) => <span className="font-semibold text-blue-600">{q.quotationNumber}</span>,
    },
    {
      header: 'Customer',
      cell: (q) => (
        <div>
          <p className="font-medium text-slate-900">{q.customer?.name}</p>
          <p className="text-xs text-slate-400">{q.customer?.company || ''}</p>
        </div>
      ),
    },
    {
      header: 'Plan',
      cell: (q) => q.plan?.name || '—',
    },
    {
      header: 'Grand Total',
      cell: (q) => <span className="font-semibold">{formatCurrency(q.grandTotal)}</span>,
    },
    {
      header: 'Expires',
      cell: (q) => formatDate(q.expiryDate),
    },
    {
      header: 'Status',
      cell: (q) => <Badge status={q.status} />,
    },
    {
      header: 'Actions',
      cell: (q) => (
        <div className="flex items-center gap-2">
          {q.status === 'DRAFT' || q.status === 'SENT' ? (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => confirmMutation.mutate(q.id)}
                isLoading={confirmMutation.isPending}
                title="Confirm & Convert to Subscription"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Confirm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => cancelMutation.mutate(q.id)}
                className="text-rose-600 hover:text-rose-700"
                title="Cancel Quote"
              >
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            </>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commercial Quotations</h1>
          <p className="text-sm text-slate-500">Draft proposals, negotiate pricing and convert quotes into subscriptions</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create Quotation
        </Button>
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

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Quotation" maxWidth="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Customer</label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="">Select customer...</option>
                {customersData?.data.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company || 'Personal'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
              <select
                required
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="">Select subscription plan...</option>
                {plansData?.data.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({formatCurrency(p.price)} / {p.billingInterval.toLowerCase()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Primary Product</label>
              <select
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="">Select product...</option>
                {productsData?.data.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name} ({formatCurrency(prod.salesPrice)})
                  </option>
                ))}
              </select>
            </div>
            <Input label="Quantity" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Validity (Days)" type="number" value={validityDays} onChange={(e) => setValidityDays(e.target.value)} />
            <Input label="Payment Terms" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Net 30" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createQuotationMutation.isPending}>
              Generate Quotation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


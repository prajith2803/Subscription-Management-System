import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, Column } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { formatCurrency, formatDate } from '../../utils';
import { ArrowLeft, Play, Pause, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const SubscriptionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [closeReason, setCloseReason] = useState('');

  const { data: sub, isLoading } = useQuery({
    queryKey: ['subscription', id],
    queryFn: () => subscriptionsApi.getById(id!),
  });

  const pauseMutation = useMutation({
    mutationFn: () => subscriptionsApi.pause(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast.success('Subscription paused');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to pause subscription'),
  });

  const resumeMutation = useMutation({
    mutationFn: () => subscriptionsApi.resume(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast.success('Subscription resumed to Active');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to resume subscription'),
  });

  const renewMutation = useMutation({
    mutationFn: () => subscriptionsApi.renew(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast.success('Subscription renewed successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to renew subscription'),
  });

  const closeMutation = useMutation({
    mutationFn: () => subscriptionsApi.close(id!, closeReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', id] });
      toast.success('Subscription closed');
      setIsCloseModalOpen(false);
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to close subscription'),
  });

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-400">Loading subscription details...</div>;
  }

  if (!sub) {
    return <div className="py-12 text-center text-sm text-slate-400">Subscription not found</div>;
  }

  const invoiceColumns: Column<any>[] = [
    {
      header: 'Invoice #',
      cell: (inv) => (
        <Link to={`/invoices/${inv.id}`} className="font-semibold text-blue-600 hover:underline">
          {inv.invoiceNumber}
        </Link>
      ),
    },
    { header: 'Date', cell: (inv) => formatDate(inv.invoiceDate) },
    { header: 'Due Date', cell: (inv) => formatDate(inv.dueDate) },
    { header: 'Grand Total', cell: (inv) => formatCurrency(inv.grandTotal) },
    { header: 'Outstanding', cell: (inv) => formatCurrency(inv.outstandingBalance) },
    { header: 'Status', cell: (inv) => <Badge status={inv.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/subscriptions">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{sub.subscriptionNumber}</h1>
              <Badge status={sub.status} />
            </div>
            <p className="text-sm text-slate-500">
              Customer: <span className="font-medium text-slate-700">{sub.customer?.name}</span> ({sub.customer?.company || 'Personal'})
            </p>
          </div>
        </div>

        {/* Lifecycle Action Buttons */}
        <div className="flex items-center gap-2">
          {sub.status === 'ACTIVE' && sub.plan?.allowPause && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => pauseMutation.mutate()}
              isLoading={pauseMutation.isPending}
            >
              <Pause className="h-3.5 w-3.5 mr-1 text-amber-600" />
              Pause
            </Button>
          )}

          {sub.status === 'PAUSED' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => resumeMutation.mutate()}
              isLoading={resumeMutation.isPending}
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              Resume
            </Button>
          )}

          {sub.status === 'CLOSED' && sub.plan?.allowRenewal && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => renewMutation.mutate()}
              isLoading={renewMutation.isPending}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Renew Contract
            </Button>
          )}

          {sub.status !== 'CLOSED' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={() => setIsCloseModalOpen(true)}
            >
              <XCircle className="h-3.5 w-3.5 mr-1" />
              Close Subscription
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Contract Terms" className="space-y-3 text-sm">
          <div className="flex justify-between py-1 border-b">
            <span className="text-slate-500">Plan</span>
            <span className="font-semibold text-slate-800">{sub.plan?.name}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-slate-500">Billing Interval</span>
            <span className="font-semibold text-slate-800">{sub.plan?.billingInterval}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-slate-500">Monthly Contract Value</span>
            <span className="font-semibold text-slate-800">{formatCurrency(sub.monthlyValue)}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-slate-500">Start Date</span>
            <span className="text-slate-700">{formatDate(sub.startDate)}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-slate-500">Next Billing Date</span>
            <span className="font-semibold text-blue-600">{formatDate(sub.nextBillingDate)}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500">Payment Terms</span>
            <span className="text-slate-700">{sub.paymentTerms || 'Standard'}</span>
          </div>
        </Card>

        <Card title="Product Line Items" className="md:col-span-2">
          <div className="divide-y text-sm">
            {sub.lines?.map((line) => (
              <div key={line.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-900">{line.product?.name}</p>
                  {line.variant && <p className="text-xs text-slate-400">Variant: {line.variant.name}</p>}
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(line.lineTotal)}</p>
                  <p className="text-xs text-slate-400">Qty: {line.quantity} × {formatCurrency(line.unitPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Generated Invoices Table */}
      <Card title="Generated Recurring Invoices">
        <Table
          columns={invoiceColumns}
          data={sub.invoices || []}
          emptyMessage="No recurring invoices generated yet"
        />
      </Card>

      {/* Early Close Modal */}
      <Modal isOpen={isCloseModalOpen} onClose={() => setIsCloseModalOpen(false)} title="Close Subscription">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to close this subscription? Recurring billing will stop immediately.
          </p>
          <Input
            label="Reason for Closure"
            required
            value={closeReason}
            onChange={(e) => setCloseReason(e.target.value)}
            placeholder="e.g. Customer requested early termination"
          />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsCloseModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={closeMutation.isPending} onClick={() => closeMutation.mutate()}>
              Confirm Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


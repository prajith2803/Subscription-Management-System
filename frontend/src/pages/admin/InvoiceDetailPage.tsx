import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi, paymentsApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../utils';
import { ArrowLeft, Download, CheckCircle, CreditCard, Building, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Payment form states
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'OTHER'>('BANK_TRANSFER');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.getById(id!),
  });

  const confirmMutation = useMutation({
    mutationFn: () => invoicesApi.confirm(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      toast.success('Invoice confirmed');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to confirm invoice'),
  });

  const recordPaymentMutation = useMutation({
    mutationFn: paymentsApi.record,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      toast.success('Payment recorded successfully');
      setIsPaymentModalOpen(false);
      setPaymentAmount('');
      setTransactionReference('');
      setNotes('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to record payment'),
  });

  const handleDownloadPdf = async () => {
    try {
      toast.loading('Downloading PDF...', { id: 'pdf' });
      await invoicesApi.downloadPdf(id!);
      toast.success('Invoice PDF downloaded', { id: 'pdf' });
    } catch {
      toast.error('Failed to download invoice PDF', { id: 'pdf' });
    }
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    recordPaymentMutation.mutate({
      invoiceId: invoice.id,
      amount: Number(paymentAmount),
      paymentMethod,
      transactionReference,
      notes,
    });
  };

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-400">Loading invoice details...</div>;
  }

  if (!invoice) {
    return <div className="py-12 text-center text-sm text-slate-400">Invoice not found</div>;
  }

  const outstanding = Number(invoice.outstandingBalance);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/invoices">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{invoice.invoiceNumber}</h1>
              <Badge status={invoice.status} />
            </div>
            <p className="text-sm text-slate-500">
              Subscription: <Link to={`/subscriptions/${invoice.subscriptionId}`} className="text-blue-600 hover:underline">{invoice.subscription?.subscriptionNumber}</Link>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {invoice.status === 'DRAFT' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => confirmMutation.mutate()}
              isLoading={confirmMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirm Invoice
            </Button>
          )}

          {outstanding > 0 && invoice.status !== 'CANCELLED' && (
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                setPaymentAmount(outstanding.toString());
                setIsPaymentModalOpen(true);
              }}
            >
              <CreditCard className="h-4 w-4 mr-1" />
              Record Payment
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-1" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer & Dates Info */}
        <Card title="Billing Details" className="space-y-4 text-sm">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Billed Customer</span>
            <div className="mt-1 flex items-start gap-2 text-slate-800">
              <Building className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <p className="font-semibold">{invoice.customer?.name}</p>
                <p className="text-xs text-slate-500">{invoice.customer?.company || ''}</p>
                {invoice.customer?.taxId && (
                  <p className="text-xs text-slate-500">GST/Tax ID: {invoice.customer.taxId}</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t">
            <span className="text-xs font-semibold text-slate-400 uppercase">Period & Deadlines</span>
            <div className="mt-2 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Invoice Date:</span>
                <span className="font-medium text-slate-800">{formatDate(invoice.invoiceDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Due Date:</span>
                <span className="font-medium text-slate-800">{formatDate(invoice.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Billing Period:</span>
                <span className="font-medium text-slate-800">
                  {formatDate(invoice.billingPeriodStart)} – {formatDate(invoice.billingPeriodEnd)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Invoice Summary Totals */}
        <Card title="Payment Summary" className="md:col-span-2 space-y-3 text-sm">
          <div className="flex justify-between py-1 border-b">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium text-slate-800">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between py-1 border-b text-emerald-600">
            <span>Discounts Applied</span>
            <span>- {formatCurrency(invoice.discountAmount)}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span className="text-slate-500">Taxes (GST)</span>
            <span className="font-medium text-slate-800">+ {formatCurrency(invoice.taxAmount)}</span>
          </div>
          <div className="flex justify-between py-2 border-b text-base font-bold text-slate-900 bg-slate-50 px-3 rounded">
            <span>Grand Total</span>
            <span>{formatCurrency(invoice.grandTotal)}</span>
          </div>
          <div className="flex justify-between py-1 border-b text-emerald-700">
            <span>Amount Paid</span>
            <span className="font-semibold">{formatCurrency(invoice.amountPaid)}</span>
          </div>
          <div className="flex justify-between py-2 text-base font-bold text-rose-600 bg-rose-50 px-3 rounded">
            <span>Outstanding Balance</span>
            <span>{formatCurrency(invoice.outstandingBalance)}</span>
          </div>
        </Card>
      </div>

      {/* Invoice Line Items */}
      <Card title="Line Items">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b">
              <tr>
                <th className="px-4 py-3">Item Description</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Discount</th>
                <th className="px-4 py-3 text-right">Tax</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.lines?.map((line) => (
                <tr key={line.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{line.productNameSnapshot}</p>
                    {line.variantNameSnapshot && (
                      <p className="text-xs text-slate-400">Edition: {line.variantNameSnapshot}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">{line.quantity}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(line.unitPriceSnapshot)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">
                    {Number(line.discountAmount) > 0 ? `- ${formatCurrency(line.discountAmount)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(line.taxAmount)} ({line.taxRate}%)
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment History */}
      <Card title="Settlement & Payment Log">
        {invoice.payments && invoice.payments.length > 0 ? (
          <div className="divide-y text-sm">
            {invoice.payments.map((p) => (
              <div key={p.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-800">
                    {formatCurrency(p.amount)} via {p.paymentMethod.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-slate-400">
                    Ref: {p.transactionReference || 'N/A'} • {formatDate(p.paymentDate)}
                  </p>
                </div>
                <Badge status="PAID" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 py-4 text-center">No payments recorded for this invoice yet.</p>
        )}
      </Card>

      {/* Record Payment Modal */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Record Payment">
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <p className="text-xs text-slate-500 mb-1">Outstanding Balance</p>
            <p className="text-xl font-bold text-rose-600">{formatCurrency(outstanding)}</p>
          </div>

          <Input
            label="Payment Amount (₹)"
            type="number"
            step="0.01"
            max={outstanding}
            min="0.01"
            required
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
            >
              <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="CASH">Cash</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <Input
            label="Transaction Reference / Cheque #"
            value={transactionReference}
            onChange={(e) => setTransactionReference(e.target.value)}
            placeholder="e.g. UTR-20251031-01"
          />

          <Input
            label="Internal Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional settlement notes..."
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={recordPaymentMutation.isPending}>
              Confirm Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


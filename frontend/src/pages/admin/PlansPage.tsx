import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils';
import { Plan, BillingInterval } from '../../types';
import { Plus, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export const PlansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('MONTHLY');
  const [price, setPrice] = useState('');
  const [minimumQuantity, setMinimumQuantity] = useState('1');
  const [allowPause, setAllowPause] = useState(true);
  const [allowEarlyClose, setAllowEarlyClose] = useState(true);
  const [allowRenewal, setAllowRenewal] = useState(true);
  const [autoClose, setAutoClose] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.list({ limit: 50 }),
  });

  const createPlanMutation = useMutation({
    mutationFn: plansApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success('Subscription plan created');
      setIsModalOpen(false);
      setName('');
      setDescription('');
      setPrice('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create plan'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createPlanMutation.mutate({
      name,
      description,
      billingInterval,
      price: Number(price),
      minimumQuantity: Number(minimumQuantity),
      allowPause,
      allowEarlyClose,
      allowRenewal,
      autoClose,
    });
  };

  const columns: Column<Plan>[] = [
    {
      header: 'Plan Name',
      cell: (p) => (
        <div>
          <p className="font-semibold text-slate-900">{p.name}</p>
          <p className="text-xs text-slate-400">{p.description || 'No description'}</p>
        </div>
      ),
    },
    {
      header: 'Interval',
      cell: (p) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
          {p.billingInterval}
        </span>
      ),
    },
    {
      header: 'Price',
      cell: (p) => formatCurrency(p.price),
    },
    {
      header: 'Rules (Pause/Close/Renew)',
      cell: (p) => (
        <div className="flex items-center gap-3 text-xs text-slate-600">
          <span className="flex items-center gap-1" title="Pause allowed">
            Pause: {p.allowPause ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-300" />}
          </span>
          <span className="flex items-center gap-1" title="Early close allowed">
            Close: {p.allowEarlyClose ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-300" />}
          </span>
          <span className="flex items-center gap-1" title="Renewal allowed">
            Renew: {p.allowRenewal ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <X className="h-3.5 w-3.5 text-slate-300" />}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (p) => <Badge status={p.isActive ? 'ACTIVE' : 'CLOSED'} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscription Plans</h1>
          <p className="text-sm text-slate-500">Configure recurring billing intervals, pricing models and lifecycle rules</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create Plan
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={data?.data || []} isLoading={isLoading} />
      </Card>

      {/* Create Plan Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Subscription Plan">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Plan Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Pro Monthly" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Billing Interval</label>
              <select
                value={billingInterval}
                onChange={(e) => setBillingInterval(e.target.value as BillingInterval)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>
            <Input label="Plan Price (₹)" type="number" required value={price} onChange={(e) => setPrice(e.target.value)} placeholder="10000" />
          </div>

          <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Professional plan with unlimited features..." />

          {/* Feature Flags */}
          <div className="space-y-2 pt-2 border-t text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={allowPause} onChange={(e) => setAllowPause(e.target.checked)} className="rounded text-blue-600" />
              <span>Allow customer or staff to pause subscription</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={allowEarlyClose} onChange={(e) => setAllowEarlyClose(e.target.checked)} className="rounded text-blue-600" />
              <span>Allow early termination / cancellation</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={allowRenewal} onChange={(e) => setAllowRenewal(e.target.checked)} className="rounded text-blue-600" />
              <span>Allow renewal upon expiry</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={autoClose} onChange={(e) => setAutoClose(e.target.checked)} className="rounded text-blue-600" />
              <span>Automatically close subscription when plan ends</span>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createPlanMutation.isPending}>
              Save Plan
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


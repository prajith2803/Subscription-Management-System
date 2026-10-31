import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { discountsApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils';
import { Discount } from '../../types';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export const DiscountsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState('10');
  const [minimumAmount, setMinimumAmount] = useState('1000');
  const [maxUsageCount, setMaxUsageCount] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['discounts'],
    queryFn: () => discountsApi.list({ limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: discountsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Discount rule created');
      setIsModalOpen(false);
      setCode('');
      setName('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create discount'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      code: code.toUpperCase(),
      name,
      discountType,
      value: Number(value),
      minimumAmount: Number(minimumAmount),
      maxUsageCount: maxUsageCount ? Number(maxUsageCount) : null,
      isSubscriptionWide: true,
    });
  };

  const columns: Column<Discount>[] = [
    {
      header: 'Code',
      cell: (d) => (
        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {d.code}
        </span>
      ),
    },
    {
      header: 'Discount Name',
      accessorKey: 'name',
    },
    {
      header: 'Benefit',
      cell: (d) => (d.discountType === 'PERCENTAGE' ? `${d.value}% Off` : `₹${d.value} Flat Off`),
    },
    {
      header: 'Min Amount',
      cell: (d) => formatCurrency(d.minimumAmount),
    },
    {
      header: 'Usage',
      cell: (d) => `${d.usageCount} / ${d.maxUsageCount ?? '∞'} used`,
    },
    {
      header: 'Status',
      cell: (d) => <Badge status={d.isActive ? 'ACTIVE' : 'EXPIRED'} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Discount Engine</h1>
          <p className="text-sm text-slate-500">Configure promotional voucher codes and recurring contract discounts</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create Discount
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={data?.data || []} isLoading={isLoading} />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Discount Rule">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Promo Code" required value={code} onChange={(e) => setCode(e.target.value)} placeholder="PROMO20" />
          <Input label="Description Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="20% Festival Discount" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <Input label="Discount Value" type="number" required value={value} onChange={(e) => setValue(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Min Order Amount (₹)" type="number" value={minimumAmount} onChange={(e) => setMinimumAmount(e.target.value)} />
            <Input label="Max Usages (Optional)" type="number" value={maxUsageCount} onChange={(e) => setMaxUsageCount(e.target.value)} placeholder="Unlimited" />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Save Discount
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


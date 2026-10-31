import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taxesApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { TaxRule } from '../../types';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export const TaxesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [percentage, setPercentage] = useState('18');
  const [taxType, setTaxType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [appliesToAll, setAppliesToAll] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['taxes'],
    queryFn: () => taxesApi.list({ limit: 50 }),
  });

  const createMutation = useMutation({
    mutationFn: taxesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
      toast.success('Tax rule created');
      setIsModalOpen(false);
      setName('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create tax rule'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      percentage: Number(percentage),
      taxType,
      appliesToAll,
    });
  };

  const columns: Column<TaxRule>[] = [
    {
      header: 'Tax Name',
      accessorKey: 'name',
      cell: (t) => <span className="font-semibold text-slate-900">{t.name}</span>,
    },
    {
      header: 'Rate / Amount',
      cell: (t) => (t.taxType === 'PERCENTAGE' ? `${t.percentage}%` : `₹${t.fixedAmount}`),
    },
    {
      header: 'Type',
      accessorKey: 'taxType',
    },
    {
      header: 'Application',
      cell: (t) => (t.appliesToAll ? 'All Products' : 'Product-Specific'),
    },
    {
      header: 'Status',
      cell: (t) => <Badge status={t.isActive ? 'ACTIVE' : 'CLOSED'} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tax Management Engine</h1>
          <p className="text-sm text-slate-500">Configure Goods & Services Tax (GST) rates applied to invoices</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Tax Rule
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={data?.data || []} isLoading={isLoading} />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Configure Tax Rule">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Tax Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. GST 18%" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tax Type</label>
              <select
                value={taxType}
                onChange={(e) => setTaxType(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount (₹)</option>
              </select>
            </div>
            <Input label="Tax Rate (%)" type="number" required value={percentage} onChange={(e) => setPercentage(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 pt-2 text-sm text-slate-700">
            <input type="checkbox" checked={appliesToAll} onChange={(e) => setAppliesToAll(e.target.checked)} className="rounded text-blue-600" />
            <span>Applies automatically to all products</span>
          </label>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Save Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


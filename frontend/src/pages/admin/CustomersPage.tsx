import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatDate } from '../../utils';
import { Customer } from '../../types';
import { Plus, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search],
    queryFn: () => customersApi.list({ page, limit: 10, search }),
  });

  const createMutation = useMutation({
    mutationFn: customersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer registered successfully');
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setCompany('');
      setPhone('');
      setCity('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to create customer');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ name, email, company, phone, city });
  };

  const columns: Column<Customer>[] = [
    {
      header: 'Name',
      cell: (c) => (
        <div>
          <p className="font-semibold text-slate-900">{c.name}</p>
          <p className="text-xs text-slate-400">{c.user?.email || '—'}</p>
        </div>
      ),
    },
    {
      header: 'Company',
      accessorKey: 'company',
      cell: (c) => c.company || '—',
    },
    {
      header: 'Phone',
      accessorKey: 'phone',
      cell: (c) => c.phone || '—',
    },
    {
      header: 'City',
      accessorKey: 'city',
      cell: (c) => c.city || '—',
    },
    {
      header: 'Status',
      cell: (c) => <Badge status={c.isActive ? 'ACTIVE' : 'CLOSED'} />,
    },
    {
      header: 'Joined',
      cell: (c) => formatDate(c.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer Accounts</h1>
          <p className="text-sm text-slate-500">Manage client profiles, subscriptions and billing histories</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Customer
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email or company..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          onRowClick={(c) => navigate(`/customers/${c.id}`)}
        />

        <Pagination
          page={page}
          totalPages={data?.totalPages || 1}
          total={data?.total || 0}
          limit={10}
          onPageChange={setPage}
        />
      </Card>

      {/* Create Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Customer">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Full Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Buyer" />
          <Input label="Email address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="buyer@acme.com" />
          <Input label="Company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." />
          <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91-9876543210" />
          <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


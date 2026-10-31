import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils';
import { Plus, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

export const StaffPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['staff-users'],
    queryFn: () => usersApi.list({ role: 'STAFF' }),
  });

  const createStaffMutation = useMutation({
    mutationFn: usersApi.createStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-users'] });
      toast.success('Staff account created');
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create staff account'),
  });

  const deactivateMutation = useMutation({
    mutationFn: usersApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-users'] });
      toast.success('Account deactivated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to deactivate account'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createStaffMutation.mutate({ name, email, password, role: 'STAFF' });
  };

  const columns: Column<any>[] = [
    {
      header: 'Staff Member',
      cell: (u) => (
        <div>
          <p className="font-semibold text-slate-900">{u.customer?.name || 'Staff'}</p>
          <p className="text-xs text-slate-400">{u.email}</p>
        </div>
      ),
    },
    {
      header: 'Role',
      cell: (u) => <Badge status={u.role} />,
    },
    {
      header: 'Status',
      cell: (u) => <Badge status={u.isActive ? 'ACTIVE' : 'CLOSED'} />,
    },
    {
      header: 'Created On',
      cell: (u) => formatDate(u.createdAt),
    },
    {
      header: 'Actions',
      cell: (u) =>
        u.isActive ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:text-rose-700"
            onClick={() => deactivateMutation.mutate(u.id)}
          >
            <UserX className="h-4 w-4 mr-1" /> Deactivate
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff Account Management</h1>
          <p className="text-sm text-slate-500">Only Administrator can provision operational staff accounts</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create Staff Account
        </Button>
      </div>

      <Card>
        <Table columns={columns} data={data?.data || []} isLoading={isLoading} />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Provision Staff Account">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Staff Full Name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Alice Johnson" />
          <Input label="Email address" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="alice@brightloop.com" />
          <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" helperText="Must be >8 chars with uppercase, lowercase, and special character" />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createStaffMutation.isPending}>
              Create Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


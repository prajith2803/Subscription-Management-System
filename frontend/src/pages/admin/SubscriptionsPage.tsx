import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { formatCurrency, formatDate } from '../../utils';
import { Subscription } from '../../types';

export const SubscriptionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['subscriptions', page, statusFilter],
    queryFn: () => subscriptionsApi.list({ page, limit: 10, status: statusFilter || undefined }),
  });

  const columns: Column<Subscription>[] = [
    {
      header: 'Sub Number',
      cell: (s) => <span className="font-semibold text-blue-600">{s.subscriptionNumber}</span>,
    },
    {
      header: 'Customer',
      cell: (s) => (
        <div>
          <p className="font-medium text-slate-900">{s.customer?.name}</p>
          <p className="text-xs text-slate-400">{s.customer?.company || ''}</p>
        </div>
      ),
    },
    {
      header: 'Plan',
      cell: (s) => (
        <div>
          <p className="font-medium text-slate-800">{s.plan?.name}</p>
          <span className="text-[10px] font-semibold text-blue-600 uppercase">{s.plan?.billingInterval}</span>
        </div>
      ),
    },
    {
      header: 'Billing Amount',
      cell: (s) => <span className="font-semibold">{formatCurrency(s.monthlyValue)}</span>,
    },
    {
      header: 'Next Billing',
      cell: (s) => formatDate(s.nextBillingDate),
    },
    {
      header: 'Status',
      cell: (s) => <Badge status={s.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subscription Lifecycles</h1>
          <p className="text-sm text-slate-500">Monitor active contracts, recurring schedules, pauses and renewals</p>
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
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          onRowClick={(s) => navigate(`/subscriptions/${s.id}`)}
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


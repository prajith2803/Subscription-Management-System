import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogsApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Table, Column } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { formatDate } from '../../utils';
import { AuditLog } from '../../types';

export const AuditLogsPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => auditLogsApi.list({ page, limit: 15 }),
  });

  const columns: Column<AuditLog>[] = [
    {
      header: 'Action',
      cell: (log) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
          {log.action}
        </span>
      ),
    },
    {
      header: 'Entity',
      cell: (log) => `${log.entityType} (${log.entityId?.slice(0, 8) || 'N/A'}...)`,
    },
    {
      header: 'Actor / User',
      cell: (log) => log.user?.email || 'System / Scheduler',
    },
    {
      header: 'IP Address',
      cell: (log) => log.ipAddress || '127.0.0.1',
    },
    {
      header: 'Timestamp',
      cell: (log) => formatDate(log.createdAt),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Security Audit Logs</h1>
        <p className="text-sm text-slate-500">Immutable audit records for compliance, logins, and billing modifications</p>
      </div>

      <Card>
        <Table columns={columns} data={data?.data || []} isLoading={isLoading} />
        <Pagination
          page={page}
          totalPages={data?.totalPages || 1}
          total={data?.total || 0}
          limit={15}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
};


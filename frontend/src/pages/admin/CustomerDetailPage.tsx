import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customersApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Table, Column } from '../../components/ui/Table';
import { formatCurrency, formatDate } from '../../utils';
import { ArrowLeft, Mail, Phone, Building, MapPin } from 'lucide-react';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customersApi.getById(id!),
  });

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-400">Loading customer details...</div>;
  }

  if (!customer) {
    return <div className="py-12 text-center text-sm text-slate-400">Customer not found</div>;
  }

  const subColumns: Column<any>[] = [
    {
      header: 'Sub #',
      cell: (s) => (
        <Link to={`/subscriptions/${s.id}`} className="font-semibold text-blue-600 hover:underline">
          {s.subscriptionNumber}
        </Link>
      ),
    },
    { header: 'Plan', cell: (s) => s.plan?.name || '—' },
    { header: 'Status', cell: (s) => <Badge status={s.status} /> },
    { header: 'Monthly Value', cell: (s) => formatCurrency(s.monthlyValue) },
    { header: 'Next Billing', cell: (s) => formatDate(s.nextBillingDate) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/customers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{customer.name}</h1>
          <p className="text-sm text-slate-500">Customer Profile & Account History</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Card */}
        <Card title="Contact Information" className="md:col-span-1">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-slate-600">
              <Mail className="h-4 w-4 text-slate-400" />
              <span>{customer.user?.email || 'No email registered'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Phone className="h-4 w-4 text-slate-400" />
              <span>{customer.phone || 'No phone registered'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Building className="h-4 w-4 text-slate-400" />
              <span>{customer.company || 'Individual Account'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>{customer.city ? `${customer.city}, ${customer.country || ''}` : 'No address'}</span>
            </div>
            <div className="pt-3 border-t">
              <span className="text-xs font-semibold text-slate-500 uppercase">Account Status</span>
              <div className="mt-1">
                <Badge status={customer.isActive ? 'ACTIVE' : 'CLOSED'} />
              </div>
            </div>
          </div>
        </Card>

        {/* Subscriptions List */}
        <Card title="Active & Past Subscriptions" className="md:col-span-2">
          <Table
            columns={subColumns}
            data={customer.subscriptions || []}
            emptyMessage="No subscriptions associated with this customer"
          />
        </Card>
      </div>
    </div>
  );
};


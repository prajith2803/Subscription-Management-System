import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { portalApi } from '../../services/api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency, formatDate } from '../../utils';
import { Repeat } from 'lucide-react';

export const PortalSubscriptionsPage: React.FC = () => {
  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['portal-subscriptions'],
    queryFn: portalApi.getSubscriptions,
  });

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-slate-400">Loading your subscriptions...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Subscriptions</h1>
        <p className="text-sm text-slate-500">Your active software subscriptions and contract terms</p>
      </div>

      <div className="space-y-4">
        {subscriptions && subscriptions.length > 0 ? (
          subscriptions.map((sub) => (
            <Card key={sub.id} className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Repeat className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{sub.plan.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{sub.subscriptionNumber}</p>
                  </div>
                </div>
                <Badge status={sub.status} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-sm border-b border-slate-100">
                <div>
                  <span className="text-xs text-slate-400">Recurring Price</span>
                  <p className="font-semibold text-slate-800">{formatCurrency(sub.monthlyValue)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Billing Interval</span>
                  <p className="font-semibold text-slate-800">{sub.plan.billingInterval}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Start Date</span>
                  <p className="text-slate-700">{formatDate(sub.startDate)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Next Billing</span>
                  <p className="font-semibold text-blue-600">{formatDate(sub.nextBillingDate)}</p>
                </div>
              </div>

              <div className="pt-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Included Software Lines
                </span>
                <div className="mt-2 space-y-1 text-sm text-slate-700">
                  {sub.lines?.map((line) => (
                    <div key={line.id} className="flex justify-between">
                      <span>
                        {line.product?.name} {line.variant && `(${line.variant.name})`}
                      </span>
                      <span className="text-slate-500">Qty: {line.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="py-12 text-center text-slate-500 text-sm">
            You do not have any active subscriptions.
          </Card>
        )}
      </div>
    </div>
  );
};


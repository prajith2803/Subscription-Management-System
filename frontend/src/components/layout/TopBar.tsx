import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../services/api';
import { Bell, Play, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { billingApi } from '../../services/api';
import toast from 'react-hot-toast';

export const TopBar: React.FC = () => {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isBillingRunning, setIsBillingRunning] = useState(false);

  const { data: notifData, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list({ limit: 5 }),
    refetchInterval: 15000,
  });

  const handleRunBilling = async () => {
    setIsBillingRunning(true);
    try {
      const res = await billingApi.run();
      toast.success(`Billing run triggered: ${res.result?.invoicesCreated || 0} invoice(s) generated`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Billing run failed');
    } finally {
      setIsBillingRunning(false);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.readAll();
      refetch();
    } catch {
      // Ignored
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Workspace /</span>
        <span className="text-sm font-semibold text-slate-800">Brightloop Software</span>
      </div>

      <div className="flex items-center gap-4">
        {user?.role === 'ADMIN' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunBilling}
            isLoading={isBillingRunning}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Play className="h-3.5 w-3.5 mr-1.5 fill-blue-600" />
            Trigger Billing Run
          </Button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 relative transition-colors"
          >
            <Bell className="h-5 w-5" />
            {(notifData?.unreadCount ?? 0) > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Notifications</span>
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                {notifData?.data && notifData.data.length > 0 ? (
                  notifData.data.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-slate-50 text-xs">
                      <p className="font-semibold text-slate-800">{n.title}</p>
                      <p className="text-slate-500 mt-0.5">{n.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400">No new notifications</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


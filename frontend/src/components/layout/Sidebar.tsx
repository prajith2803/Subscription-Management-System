import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Package,
  CalendarCheck,
  FileText,
  Repeat,
  Receipt,
  CreditCard,
  Percent,
  Calculator,
  UserCheck,
  History,
  LogOut,
  Infinity as LogoIcon,
} from 'lucide-react';
import { cn } from '../../utils';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const navItems = [
    { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Customers', to: '/customers', icon: Users },
    { label: 'Products', to: '/products', icon: Package },
    { label: 'Plans', to: '/plans', icon: CalendarCheck },
    { label: 'Quotations', to: '/quotations', icon: FileText },
    { label: 'Subscriptions', to: '/subscriptions', icon: Repeat },
    { label: 'Invoices', to: '/invoices', icon: Receipt },
    { label: 'Payments', to: '/payments', icon: CreditCard },
    { label: 'Taxes', to: '/taxes', icon: Calculator },
    { label: 'Discounts', to: '/discounts', icon: Percent },
    ...(isAdmin
      ? [
          { label: 'Staff Team', to: '/staff', icon: UserCheck },
          { label: 'Audit Logs', to: '/audit-logs', icon: History },
        ]
      : []),
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed inset-y-0 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="bg-blue-600 p-1.5 rounded-lg text-white">
          <LogoIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-bold text-slate-100 text-sm tracking-wide">BRIGHTLOOP</h1>
          <p className="text-[10px] text-slate-400 font-medium">SUBSCRIPTION SYSTEM</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="overflow-hidden mr-2">
            <p className="text-sm font-medium text-slate-200 truncate">{user?.name || user?.email}</p>
            <span className="inline-block px-1.5 py-0.5 text-[10px] uppercase font-semibold tracking-wider rounded bg-blue-900/60 text-blue-300">
              {user?.role}
            </span>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};


import React from 'react';
import { Navigate, Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Infinity as LogoIcon, LogOut, LayoutDashboard, Repeat, Receipt, CreditCard, User } from 'lucide-react';
import { cn } from '../utils';

export const CustomerLayout: React.FC = () => {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'CUSTOMER') {
    return <Navigate to="/dashboard" replace />;
  }

  const navLinks = [
    { label: 'Dashboard', to: '/portal', icon: LayoutDashboard, end: true },
    { label: 'Subscriptions', to: '/portal/subscriptions', icon: Repeat },
    { label: 'Invoices', to: '/portal/invoices', icon: Receipt },
    { label: 'Payments', to: '/portal/payments', icon: CreditCard },
    { label: 'Profile', to: '/portal/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white">
                <LogoIcon className="h-5 w-5" />
              </div>
              <span className="font-bold text-slate-900 tracking-tight">Brightloop Portal</span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700 hidden sm:inline-block">
              {user.name || user.email}
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <Outlet />
      </main>
    </div>
  );
};


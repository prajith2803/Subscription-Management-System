import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Infinity as LogoIcon } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'CUSTOMER' ? '/portal' : '/dashboard'} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex bg-blue-600 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-500/20 mb-3">
          <LogoIcon className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Brightloop Software</h2>
        <p className="text-sm text-slate-400 mt-1">Subscription & Recurring Billing Management</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <Outlet />
        </div>
      </div>
    </div>
  );
};


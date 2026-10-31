import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email, password });
    } catch {
      setIsLoading(false);
    }
  };

  const setDemoCredentials = (role: 'ADMIN' | 'STAFF' | 'CUSTOMER') => {
    if (role === 'ADMIN') {
      setEmail('admin@brightloop.com');
      setPassword('Admin@123!');
    } else if (role === 'STAFF') {
      setEmail('staff1@brightloop.com');
      setPassword('Staff@123!');
    } else {
      setEmail('customer1@example.com');
      setPassword('Customer@123!');
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Welcome Back</h3>
      <p className="text-sm text-slate-500 mb-6">Sign in to your Brightloop account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
        />

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-800">
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      {/* Demo Credentials Helper */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Demo Logins:
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setDemoCredentials('ADMIN')}
            className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-700 transition-colors"
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => setDemoCredentials('STAFF')}
            className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-700 transition-colors"
          >
            Staff
          </button>
          <button
            type="button"
            onClick={() => setDemoCredentials('CUSTOMER')}
            className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded text-xs font-medium text-slate-700 transition-colors"
          >
            Customer
          </button>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-slate-600">
        Don't have an account?{' '}
        <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-800">
          Create customer account
        </Link>
      </div>
    </div>
  );
};


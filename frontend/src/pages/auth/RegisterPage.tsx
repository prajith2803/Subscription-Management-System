import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register({ name, email, password, company, phone });
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Create Customer Account</h3>
      <p className="text-sm text-slate-500 mb-6">Manage your software subscriptions & invoices</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
        />

        <Input
          label="Email address"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com"
        />

        <Input
          label="Company (Optional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Acme Corporation"
        />

        <Input
          label="Phone (Optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91-9876543210"
        />

        <Input
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          helperText="Must be >8 chars with uppercase, lowercase, and special character"
        />

        <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
          Register Account
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600">
        Already registered?{' '}
        <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-800">
          Sign In
        </Link>
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

export const ResetPasswordPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword(token!, password);
      toast.success('Password updated successfully. Please login.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Set New Password</h3>
      <p className="text-sm text-slate-500 mb-6">Choose a secure password for your account</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          helperText="Must be >8 chars with uppercase, lowercase, and special character"
        />

        <Input
          label="Confirm Password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
        />

        <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
          Reset Password
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-600">
        <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-800">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
};


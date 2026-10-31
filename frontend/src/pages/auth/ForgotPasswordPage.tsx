import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import toast from 'react-hot-toast';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setSubmitted(true);
      if (res.devPreviewUrl) {
        setPreviewUrl(res.devPreviewUrl);
      }
      toast.success('Reset link dispatched if email exists.');
    } catch {
      toast.error('Unable to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Reset Password</h3>
      <p className="text-sm text-slate-500 mb-6">Enter your registered email to receive a password reset link</p>

      {submitted ? (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm">
            If that email is registered, a password reset link has been sent.
          </div>
          {previewUrl && (
            <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs text-left">
              <span className="font-semibold">Development Email Preview:</span>
              <br />
              <a href={previewUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">
                {previewUrl}
              </a>
            </div>
          )}
          <Link to="/login" className="inline-block text-sm font-semibold text-blue-600 hover:text-blue-800">
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
          />

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
            Send Reset Link
          </Button>

          <div className="text-center mt-4">
            <Link to="/login" className="text-sm text-slate-500 hover:text-slate-800">
              Return to Login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
};


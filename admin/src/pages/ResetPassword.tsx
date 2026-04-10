import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <h2 className="text-lg font-semibold text-red-400 mb-3">Invalid Reset Link</h2>
          <p className="text-dark-400 text-sm mb-4">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" className="btn-primary inline-block px-6">
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {success ? 'Password Reset!' : 'Set New Password'}
          </h1>
        </div>

        {!success ? (
          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-dark pl-10 pr-10"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="input-dark pl-10"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        ) : (
          <div className="glass-card p-8 text-center space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 mx-auto">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-dark-400">Your password has been reset successfully. You can now login with your new password.</p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('If the email exists, a reset link has been sent.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Something went wrong');
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
          <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Forgot Password</h1>
          <p className="text-dark-400 mt-1">Enter your email to receive a reset link</p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-dark pl-10"
                  placeholder="you@company.com"
                  autoComplete="email"
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
                'Send Reset Link'
              )}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-dark-400 hover:text-white flex items-center gap-1 justify-center">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <div className="glass-card p-8 text-center space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 mx-auto">
              <Mail className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Check Your Email</h2>
              <p className="text-dark-400 text-sm">
                If an account with <span className="text-white font-medium">{email}</span> exists, we've sent a password reset link to that address.
              </p>
            </div>
            <Link to="/login" className="btn-primary w-full inline-block text-center">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

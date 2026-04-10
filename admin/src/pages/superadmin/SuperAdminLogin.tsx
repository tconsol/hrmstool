import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SuperAdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const { superAdminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await superAdminLogin(email, password);
      toast.success('Welcome back, Super Admin!');
      navigate('/superadmin/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await api.post('/superadmin/forgot-password', { email: forgotEmail });
      setForgotSent(true);
      toast.success('If the email exists, a reset link has been sent.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {showForgot ? <KeyRound size={32} className="text-amber-400" /> : <Shield size={32} className="text-red-500" />}
          </div>
          <h1 className="text-2xl font-bold text-white">{showForgot ? 'Reset Password' : 'Super Admin'}</h1>
          <p className="text-dark-400 mt-1">{showForgot ? 'Enter your email to receive a reset link' : 'Platform Administration Portal'}</p>
        </div>

        {!showForgot ? (
          <form onSubmit={handleSubmit} className="bg-dark-800 rounded-xl border border-dark-700 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="superadmin@hrms.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => setShowForgot(true)}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In as Super Admin'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-dark-400 hover:text-white">
                ← Back to Organization Login
              </Link>
            </div>
          </form>
        ) : !forgotSent ? (
          <form onSubmit={handleForgotPassword} className="bg-dark-800 rounded-xl border border-dark-700 p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="superadmin@hrms.com"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setShowForgot(false); setForgotSent(false); }}
                className="text-sm text-dark-400 hover:text-white flex items-center gap-1 justify-center mx-auto"
              >
                <ArrowLeft size={16} /> Back to Login
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-dark-800 rounded-xl border border-dark-700 p-6 text-center space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 mx-auto">
              <Mail className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Check Your Email</h2>
              <p className="text-dark-400 text-sm">
                If an account with that email exists, we've sent a password reset link.
              </p>
            </div>
            <button
              onClick={() => { setShowForgot(false); setForgotSent(false); }}
              className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminLogin;

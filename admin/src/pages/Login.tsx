import { useState, FormEvent } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [emailOrEmployeeId, setEmailOrEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    if (user.role === 'superadmin') {
      return <Navigate to="/superadmin/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!emailOrEmployeeId || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(emailOrEmployeeId, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      const errorCode = error.response?.data?.code;
      let errorMessage = 'Invalid credentials';

      if (errorCode === 'PASSWORD_INCORRECT') {
        errorMessage = 'Invalid password';
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-brand-600/25">
            <span className="text-white font-bold text-2xl">HR</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-dark-400 mt-1">Sign in to your HRMS account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">
              Email or Employee ID
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
              <input
                type="text"
                value={emailOrEmployeeId}
                onChange={(e) => setEmailOrEmployeeId(e.target.value)}
                className="input-dark pl-10"
                placeholder="you@company.com or EMP001"
                autoComplete="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-dark pl-10 pr-10"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Forgot Password & Username Links */}
          <div className="flex justify-between text-sm">
            <Link to="/forgot-username" className="text-brand-400 hover:text-brand-300 transition-colors">
              Forgot Email?
            </Link>
            <Link to="/forgot-password" className="text-brand-400 hover:text-brand-300 transition-colors">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>

          <p className="text-center text-sm text-dark-400">
            Don't have an organization?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
              Register here
            </Link>
          </p>

          <p className="text-center text-xs text-dark-500">
            <Link to="/superadmin/login" className="text-dark-400 hover:text-red-400 transition-colors">
              Super Admin Portal →
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;

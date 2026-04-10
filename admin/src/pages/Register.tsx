import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, User, Mail, Lock, Phone, Factory, ShieldCheck, ArrowLeft, Eye, EyeOff, Fingerprint, RefreshCw } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

type Step = 'register' | 'otp' | 'success';
type PasswordStrength = 'weak' | 'medium' | 'strong' | 'none';

// Auto-generate org ID preview: first 2 letters of each word + 4-digit random
const previewOrgId = (orgName: string): string => {
  if (!orgName.trim()) return '';
  const words = orgName.trim().split(/\s+/);
  const prefix = words
    .map(w => w.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2))
    .join('')
    .toUpperCase();
  const num = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${prefix}${num}`;
};

// Auto-generate employee ID preview: first 4 alphanumeric chars + EMP0001
const previewEmployeeId = (orgName: string): string => {
  if (!orgName.trim()) return '';
  const prefix = orgName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase();
  return `${prefix}EMP0001`;
};

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('register');
  const [organizationId, setOrganizationId] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [customOrgId, setCustomOrgId] = useState('');
  const [useCustomOrgId, setUseCustomOrgId] = useState(false);
  const [orgIdPreview, setOrgIdPreview] = useState('');
  const [form, setForm] = useState({
    orgName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    industry: '',
  });

  const handleOrgNameChange = (value: string) => {
    setForm(f => ({ ...f, orgName: value }));
    if (!useCustomOrgId) {
      setOrgIdPreview(previewOrgId(value));
    }
  };

  const regenerateOrgId = () => {
    setOrgIdPreview(previewOrgId(form.orgName));
  };

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    if (!password) return 'none';
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;

    if (strength <= 1) return 'weak';
    if (strength <= 3) return 'medium';
    return 'strong';
  };

  const passwordStrength = calculatePasswordStrength(form.password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orgName || !form.name || !form.email || !form.password || !form.confirmPassword) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        orgName: form.orgName,
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        industry: form.industry,
        customOrgId: useCustomOrgId ? customOrgId.trim() : '',
      });
      setOrganizationId(res.data.organizationId);
      setEmail(res.data.email);
      setStep('otp');
      toast.success('Registration started! Please check your email and enter the OTP to continue.', { duration: 5000 });
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { organizationId, otp });
      toast.success(res.data.message);
      setStep('success');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    try {
      await api.post('/auth/resend-otp', { organizationId });
      toast.success('New OTP sent to your email!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
            {step === 'success' ? (
              <ShieldCheck className="w-8 h-8 text-white" />
            ) : (
              <Building2 className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-white">
            {step === 'register' && 'Register Organization'}
            {step === 'otp' && 'Verify Your Email'}
            {step === 'success' && 'Registration Complete!'}
          </h1>
          <p className="text-slate-400 mt-2">
            {step === 'register' && 'Set up your HRMS in under a minute'}
            {step === 'otp' && `Enter the OTP sent to ${email}`}
            {step === 'success' && ''}
          </p>
        </div>

        {/* Step 1: Registration Form */}
        {step === 'register' && (
          <form onSubmit={handleRegister} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Organization Name *</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={form.orgName}
                  onChange={e => handleOrgNameChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Acme Corp"
                />
              </div>
              {/* Live ID previews */}
              {form.orgName.trim() && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">
                    Org ID preview: <span className="text-blue-400 font-mono font-semibold">{orgIdPreview || previewOrgId(form.orgName)}</span>
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs text-slate-400">
                    CEO Employee ID: <span className="text-emerald-400 font-mono font-semibold">{previewEmployeeId(form.orgName)}</span>
                  </span>
                </div>
              )}
            </div>

            {/* Organization ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-300">Organization ID</label>
                <button
                  type="button"
                  onClick={() => setUseCustomOrgId(v => !v)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {useCustomOrgId ? 'Use auto-generated' : 'Enter custom ID'}
                </button>
              </div>
              {useCustomOrgId ? (
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={customOrgId}
                    onChange={e => setCustomOrgId(e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 20))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent tracking-wider"
                    placeholder="e.g. TCSO1234"
                    maxLength={20}
                  />
                  <p className="mt-1 text-xs text-slate-500">4–20 alphanumeric characters only</p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-slate-700/30 border border-slate-700 rounded-lg">
                    <Fingerprint className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="font-mono text-blue-400 tracking-wider text-sm font-semibold">
                      {orgIdPreview || (form.orgName ? previewOrgId(form.orgName) : '—')}
                    </span>
                    <span className="text-xs text-slate-500 ml-auto">auto-generated</span>
                  </div>
                  <button
                    type="button"
                    onClick={regenerateOrgId}
                    disabled={!form.orgName.trim()}
                    title="Regenerate"
                    className="p-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 hover:text-white hover:border-blue-500 transition-colors disabled:opacity-40"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">CEO Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ceo@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Min 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {form.password && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    <div className={`flex-1 h-1 rounded-full transition-colors ${passwordStrength === 'none' ? 'bg-slate-600' : passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <div className={`flex-1 h-1 rounded-full transition-colors ${passwordStrength === 'none' || passwordStrength === 'weak' ? 'bg-slate-600' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                    <div className={`flex-1 h-1 rounded-full transition-colors ${passwordStrength !== 'strong' ? 'bg-slate-600' : 'bg-green-500'}`} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${passwordStrength === 'weak' ? 'text-red-400' : passwordStrength === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                      Password Strength: {passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'medium' ? 'Medium' : 'Strong'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${passwordStrength === 'weak' ? 'bg-red-500/20 text-red-300' : passwordStrength === 'medium' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
                      {passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'medium' ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-12 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {form.password && form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
              )}
              {form.password && form.confirmPassword && form.password === form.confirmPassword && (
                <p className="mt-1 text-xs text-green-400">Passwords match ✓</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Industry</label>
                <div className="relative">
                  <Factory className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={form.industry}
                    onChange={e => setForm({ ...form, industry: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="IT, Finance..."
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating...' : 'Create Organization'}
            </button>

            <p className="text-center text-slate-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300">
                Sign In
              </Link>
            </p>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 space-y-6">
            {/* Email notice */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3 text-sm text-blue-300 flex gap-2">
              <Mail className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                We've sent a <strong>6-digit OTP</strong> to <strong>{email}</strong>. Please check your inbox (and spam folder) and enter it below.
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Enter 6-digit OTP</label>
              <input
                type="text"
                value={otp}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(val);
                }}
                className="w-full text-center text-2xl tracking-[0.5em] py-4 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="text-center space-y-2">
              <p className="text-slate-400 text-sm">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-blue-400 hover:text-blue-300 font-medium disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </p>
              <button
                type="button"
                onClick={() => setStep('register')}
                className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" /> Back to registration
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success - Under Review */}
        {step === 'success' && (
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 text-center space-y-6">
            {/* Top icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 mx-auto">
              <ShieldCheck className="w-10 h-10 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">OTP Verified!</h2>
              <p className="text-emerald-400 font-medium text-sm">Email verified successfully ✓</p>
            </div>

            {/* Pending status card */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-left space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 font-semibold text-sm uppercase tracking-wide">Registration Pending</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Your organization registration is <span className="text-amber-400 font-medium">pending</span>. Our team will verify your details and activate your account soon.
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">
                You will receive an <span className="text-emerald-400 font-medium">email notification</span> after successful account activation. Please wait for the confirmation.
              </p>
            </div>

            <p className="text-slate-500 text-xs">
              Meanwhile, you can try logging in — you'll be notified once your account is active.
            </p>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              Go to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

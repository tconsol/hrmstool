import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Phone, ArrowLeft, Mail } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotUsername() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name && !phone) {
      toast.error('Please provide your name or phone number');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-username', { name, phone });
      setSent(true);
      toast.success('If a matching account is found, a reminder email has been sent.');
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
          <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Forgot Email?</h1>
          <p className="text-dark-400 mt-1">Provide your details and we'll send a reminder to your registered email</p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Your Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-dark pl-10"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="input-dark pl-10"
                  placeholder="+91..."
                />
              </div>
            </div>

            <p className="text-xs text-dark-500">Provide at least one field. Both for better matching.</p>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Find My Account'
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
                If a matching account was found, we've sent a reminder with your login email to the registered email address.
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

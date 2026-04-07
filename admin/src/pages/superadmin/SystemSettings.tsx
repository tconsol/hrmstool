import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Settings, CreditCard, Shield, Server } from 'lucide-react';

interface PlanInfo {
  price: number;
  maxEmployees: number;
  features: string[];
}

interface SystemData {
  platform: {
    name: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    maxOrganizations: number;
    defaultPlan: string;
  };
  plans: Record<string, PlanInfo>;
  pricing: {
    currency: string;
    billingCycle: string;
  };
}

const SystemSettings = () => {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: settings } = await api.get('/superadmin/settings');
      setData(settings);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch settings';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <p className="text-red-400 font-medium mb-3">{error}</p>
          <button onClick={fetchSettings} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-dark-400 mt-1">Platform configuration and plan details</p>
      </div>

      {/* Platform Settings */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Server size={18} className="text-dark-400" />
          Platform Configuration
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-dark-700/50 rounded-lg">
            <p className="text-xs text-dark-400 mb-1">Platform Name</p>
            <p className="text-sm font-medium text-white">{data.platform.name}</p>
          </div>
          <div className="p-4 bg-dark-700/50 rounded-lg">
            <p className="text-xs text-dark-400 mb-1">Registration</p>
            <p className={`text-sm font-medium ${data.platform.registrationEnabled ? 'text-green-400' : 'text-red-400'}`}>
              {data.platform.registrationEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
          <div className="p-4 bg-dark-700/50 rounded-lg">
            <p className="text-xs text-dark-400 mb-1">Maintenance Mode</p>
            <p className={`text-sm font-medium ${data.platform.maintenanceMode ? 'text-amber-400' : 'text-green-400'}`}>
              {data.platform.maintenanceMode ? 'Active' : 'Off'}
            </p>
          </div>
          <div className="p-4 bg-dark-700/50 rounded-lg">
            <p className="text-xs text-dark-400 mb-1">Max Organizations</p>
            <p className="text-sm font-medium text-white">{data.platform.maxOrganizations.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-dark-700/50 rounded-lg">
            <p className="text-xs text-dark-400 mb-1">Default Plan</p>
            <p className="text-sm font-medium text-white capitalize">{data.platform.defaultPlan}</p>
          </div>
          <div className="p-4 bg-dark-700/50 rounded-lg">
            <p className="text-xs text-dark-400 mb-1">Billing Cycle</p>
            <p className="text-sm font-medium text-white capitalize">{data.pricing.billingCycle}</p>
          </div>
        </div>
      </div>

      {/* Plan Details */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CreditCard size={18} className="text-dark-400" />
          Subscription Plans
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(data.plans).map(([name, plan]) => {
            const colors: Record<string, string> = {
              free: 'border-gray-500/30',
              starter: 'border-blue-500/30',
              professional: 'border-purple-500/30',
              enterprise: 'border-amber-500/30',
            };
            return (
              <div key={name} className={`p-4 rounded-xl border-2 ${colors[name] || 'border-dark-600'} bg-dark-700/30`}>
                <h4 className="text-sm font-semibold text-white capitalize mb-2">{name}</h4>
                <p className="text-2xl font-bold text-white mb-1">
                  {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString()}`}
                  {plan.price > 0 && <span className="text-xs text-dark-400 font-normal">/mo</span>}
                </p>
                <p className="text-xs text-dark-400 mb-3">Up to {plan.maxEmployees} employees</p>
                <div className="space-y-1.5">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-green-500" />
                      <span className="text-xs text-dark-300">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield size={18} className="text-dark-400" />
          Security & Access
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-dark-700/50 rounded-lg">
            <p className="text-xs text-dark-400 mb-1">Authentication</p>
            <p className="text-sm font-medium text-white">JWT (Bearer Token)</p>
          </div>
          <div className="p-4 bg-dark-700/50 rounded-lg">
            <p className="text-xs text-dark-400 mb-1">Password Hashing</p>
            <p className="text-sm font-medium text-white">bcrypt (12 rounds)</p>
          </div>
          <div className="p-4 bg-dark-700/50 rounded-lg">
            <p className="text-xs text-dark-400 mb-1">Multi-Tenant Isolation</p>
            <p className="text-sm font-medium text-green-400">Enabled</p>
          </div>
          <div className="p-4 bg-dark-700/50 rounded-lg">
            <p className="text-xs text-dark-400 mb-1">Role Hierarchy</p>
            <p className="text-sm font-medium text-white">SuperAdmin → CEO → HR → Manager → Employee</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;

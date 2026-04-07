import { useState, useEffect } from 'react';
import api from '../../services/api';
import { CreditCard, Save, X, Building2, Calendar, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from '../../components/ui/Select';

interface OrgSub {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  subscription: {
    plan: string;
    startDate: string;
    endDate: string;
    maxEmployees: number;
  };
  actualEmployeeCount: number;
}

interface EditState {
  orgId: string;
  plan: string;
  maxEmployees: number;
  endDate: string;
}

const SubscriptionManagement = () => {
  const [organizations, setOrganizations] = useState<OrgSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [orgsRes, settingsRes] = await Promise.all([
        api.get('/superadmin/organizations', { params: { limit: 100 } }),
        api.get('/superadmin/settings'),
      ]);
      setOrganizations(orgsRes.data.organizations);
      setSettings(settingsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (org: OrgSub) => {
    setEditing({
      orgId: org._id,
      plan: org.subscription?.plan || 'free',
      maxEmployees: org.subscription?.maxEmployees || 10,
      endDate: org.subscription?.endDate
        ? new Date(org.subscription.endDate).toISOString().split('T')[0]
        : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    });
  };

  const saveSubscription = async () => {
    if (!editing) return;
    try {
      await api.put(`/superadmin/organizations/${editing.orgId}/subscription`, {
        plan: editing.plan,
        maxEmployees: editing.maxEmployees,
        endDate: editing.endDate,
      });
      toast.success('Subscription updated');
      setEditing(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update subscription');
    }
  };

  const planConfig: Record<string, { color: string; label: string; price: number }> = {
    free: { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Free', price: 0 },
    starter: { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'Starter', price: 999 },
    professional: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', label: 'Professional', price: 2999 },
    enterprise: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Enterprise', price: 9999 },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscription Management</h1>
        <p className="text-dark-400 mt-1">Manage organization plans and billing</p>
      </div>

      {/* Plan cards overview */}
      {settings && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(settings.plans as Record<string, { price: number; maxEmployees: number; features: string[] }>).map(([key, plan]) => {
            const count = organizations.filter(o => (o.subscription?.plan || 'free') === key).length;
            return (
              <div key={key} className={`rounded-xl border p-4 ${planConfig[key]?.color || 'bg-dark-700 text-dark-300 border-dark-600'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold capitalize">{key}</h3>
                  <CreditCard size={16} />
                </div>
                <p className="text-2xl font-bold">
                  {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString()}`}
                  {plan.price > 0 && <span className="text-xs font-normal">/mo</span>}
                </p>
                <p className="text-xs opacity-70 mt-1">{count} organization{count !== 1 ? 's' : ''}</p>
                <p className="text-xs opacity-70">Up to {plan.maxEmployees} employees</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Organizations table */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Organization</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Current Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Employees</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Expires</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-dark-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map(org => {
                const plan = org.subscription?.plan || 'free';
                const cfg = planConfig[plan] || planConfig.free;
                const isEditing = editing?.orgId === org._id;
                const daysLeft = org.subscription?.endDate
                  ? Math.ceil((new Date(org.subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <tr key={org._id} className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-dark-400" />
                        <div>
                          <p className="text-sm font-medium text-white">{org.name}</p>
                          <p className="text-xs text-dark-400">{org.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="w-36">
                          <Select
                            value={editing.plan}
                            onChange={val => setEditing({ ...editing, plan: val })}
                            options={[
                              { value: 'free', label: 'Free' },
                              { value: 'starter', label: 'Starter' },
                              { value: 'professional', label: 'Professional' },
                              { value: 'enterprise', label: 'Enterprise' },
                            ]}
                            placeholder="Select plan"
                          />
                        </div>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editing.maxEmployees}
                          onChange={e => setEditing({ ...editing, maxEmployees: parseInt(e.target.value) || 0 })}
                          className="w-20 px-2 py-1 bg-dark-700 border border-dark-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          <Users size={14} className="text-dark-400" />
                          <span className="text-sm text-dark-300">
                            {org.actualEmployeeCount} / {org.subscription?.maxEmployees || '∞'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editing.endDate}
                          onChange={e => setEditing({ ...editing, endDate: e.target.value })}
                          className="px-2 py-1 bg-dark-700 border border-dark-600 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                        />
                      ) : (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-dark-400" />
                          <span className={`text-sm ${daysLeft !== null && daysLeft < 30 ? 'text-amber-400' : 'text-dark-300'}`}>
                            {org.subscription?.endDate
                              ? `${new Date(org.subscription.endDate).toLocaleDateString()} ${daysLeft !== null ? `(${daysLeft}d)` : ''}`
                              : '—'}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button
                              onClick={saveSubscription}
                              className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10"
                              title="Save"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => setEditing(null)}
                              className="p-1.5 rounded-lg text-dark-400 hover:bg-dark-600"
                              title="Cancel"
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => startEdit(org)}
                            className="px-3 py-1 rounded-lg text-xs font-medium bg-dark-700 text-dark-300 hover:text-white transition-colors"
                          >
                            Edit Plan
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;

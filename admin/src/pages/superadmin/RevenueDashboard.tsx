import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  DollarSign,
  Building2,
  AlertTriangle,
  ArrowUpRight,
  CreditCard,
} from 'lucide-react';

interface RevenueSummary {
  totalMonthlyRevenue: number;
  totalAnnualRevenue: number;
  totalOrganizations: number;
  paidOrganizations: number;
  expiringSoon: number;
}

interface OrgRevenue {
  _id: string;
  name: string;
  plan: string;
  monthlyAmount: number;
  isActive: boolean;
  subscriptionEnd: string | null;
}

const RevenueDashboard = () => {
  const [summary, setSummary] = useState<RevenueSummary | null>(null);
  const [revenueByPlan, setRevenueByPlan] = useState<Record<string, number>>({});
  const [organizations, setOrganizations] = useState<OrgRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    try {
      const { data } = await api.get('/superadmin/revenue');
      setSummary(data.summary);
      setRevenueByPlan(data.revenueByPlan);
      setOrganizations(data.organizations);
    } catch (error: any) {      toast.error('Failed to fetch revenue data');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!summary) return null;

  const planColors: Record<string, string> = {
    free: 'text-gray-400',
    starter: 'text-blue-400',
    professional: 'text-purple-400',
    enterprise: 'text-amber-400',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Revenue</h1>
        <p className="text-dark-400 mt-1">Subscription revenue insights and projections</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <DollarSign size={20} className="text-green-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{fmt(summary.totalMonthlyRevenue)}</p>
          <p className="text-sm text-dark-400">Monthly Revenue</p>
        </div>

        <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{fmt(summary.totalAnnualRevenue)}</p>
          <p className="text-sm text-dark-400">Annual Revenue (proj.)</p>
        </div>

        <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <CreditCard size={20} className="text-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{summary.paidOrganizations}</p>
          <p className="text-sm text-dark-400">Paid Organizations</p>
          <p className="text-xs text-dark-500">of {summary.totalOrganizations} total</p>
        </div>

        <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{summary.expiringSoon}</p>
          <p className="text-sm text-dark-400">Expiring Soon</p>
          <p className="text-xs text-dark-500">within 30 days</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Plan */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue by Plan</h3>
          <div className="space-y-4">
            {Object.entries(revenueByPlan).map(([plan, amount]) => {
              const total = Object.values(revenueByPlan).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? (amount / total) * 100 : 0;
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium capitalize ${planColors[plan] || 'text-dark-300'}`}>{plan}</span>
                    <span className="text-sm text-dark-400">{fmt(amount)}/mo ({Math.round(pct)}%)</span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        plan === 'enterprise' ? 'bg-amber-500' :
                        plan === 'professional' ? 'bg-purple-500' :
                        plan === 'starter' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-dark-700">
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-400">Total Monthly</span>
              <span className="text-lg font-bold text-white">{fmt(summary.totalMonthlyRevenue)}</span>
            </div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Conversion Metrics</h3>
          <div className="space-y-4">
            <div className="p-4 bg-dark-700/50 rounded-lg">
              <p className="text-sm text-dark-400 mb-1">Paid Conversion Rate</p>
              <p className="text-3xl font-bold text-green-400">
                {summary.totalOrganizations > 0
                  ? Math.round((summary.paidOrganizations / summary.totalOrganizations) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-dark-500 mt-1">
                {summary.paidOrganizations} paid of {summary.totalOrganizations} total
              </p>
            </div>

            <div className="p-4 bg-dark-700/50 rounded-lg">
              <p className="text-sm text-dark-400 mb-1">Average Revenue Per Org</p>
              <p className="text-3xl font-bold text-blue-400">
                {summary.paidOrganizations > 0
                  ? fmt(Math.round(summary.totalMonthlyRevenue / summary.paidOrganizations))
                  : fmt(0)}
              </p>
              <p className="text-xs text-dark-500 mt-1">per paid organization</p>
            </div>

            <div className="p-4 bg-dark-700/50 rounded-lg">
              <p className="text-sm text-dark-400 mb-1">Free Tier Orgs</p>
              <p className="text-3xl font-bold text-gray-400">
                {summary.totalOrganizations - summary.paidOrganizations}
              </p>
              <p className="text-xs text-dark-500 mt-1">potential upsell opportunities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Table */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-700">
          <h3 className="text-lg font-semibold text-white">Organization Revenue</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Organization</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Monthly</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Annual</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {organizations
                .sort((a, b) => b.monthlyAmount - a.monthlyAmount)
                .map(org => (
                <tr key={org._id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-dark-400" />
                      <span className="text-sm text-white">{org.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm capitalize ${planColors[org.plan] || 'text-dark-300'}`}>
                      {org.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-white">{fmt(org.monthlyAmount)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-dark-300">{fmt(org.monthlyAmount * 12)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      org.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {org.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RevenueDashboard;

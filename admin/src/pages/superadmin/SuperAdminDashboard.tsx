import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Building2,
  Users,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  AlertCircle,
  Clock,
} from 'lucide-react';

interface DashboardStats {
  organizations: {
    total: number;
    active: number;
    suspended: number;
    pendingApproval: number;
    recentSignups: number;
  };
  users: {
    total: number;
    active: number;
  };
  revenue: {
    monthly: number;
    annual: number;
    currency: string;
  };
  planDistribution: Record<string, number>;
  monthlyGrowth: Array<{ _id: { year: number; month: number }; count: number }>;
}

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/superadmin/dashboard');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Total Organizations',
      value: stats.organizations.total,
      subtitle: `${stats.organizations.recentSignups} new this month`,
      icon: Building2,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Active Organizations',
      value: stats.organizations.active,
      subtitle: `${stats.organizations.suspended} suspended`,
      icon: Activity,
      color: 'text-green-500',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Pending Approval',
      value: stats.organizations.pendingApproval,
      subtitle: 'Organizations awaiting review',
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Total Users',
      value: stats.users.total,
      subtitle: `${stats.users.active} active`,
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(stats.revenue.monthly),
      subtitle: `${formatCurrency(stats.revenue.annual)} annually`,
      icon: TrendingUp,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      isString: true,
    },
  ];

  const planColors: Record<string, string> = {
    free: 'bg-gray-500',
    starter: 'bg-blue-500',
    professional: 'bg-purple-500',
    enterprise: 'bg-amber-500',
  };

  const totalPlans = Object.values(stats.planDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Dashboard</h1>
        <p className="text-dark-400 mt-1">Overview of all organizations and platform metrics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-dark-800 rounded-xl border border-dark-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                <card.icon size={20} className={card.color} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {card.isString ? card.value : card.value.toLocaleString()}
            </p>
            <p className="text-sm text-dark-400 mt-1">{card.label}</p>
            <p className="text-xs text-dark-500 mt-0.5">{card.subtitle}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard size={18} className="text-dark-400" />
            Plan Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.planDistribution).map(([plan, count]) => (
              <div key={plan}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-dark-300 capitalize">{plan}</span>
                  <span className="text-sm text-dark-400">
                    {count} ({totalPlans > 0 ? Math.round((count / totalPlans) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full bg-dark-700 rounded-full h-2">
                  <div
                    className={`${planColors[plan] || 'bg-gray-500'} h-2 rounded-full transition-all`}
                    style={{ width: `${totalPlans > 0 ? (count / totalPlans) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Growth */}
        <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowUpRight size={18} className="text-dark-400" />
            Monthly Sign-ups
          </h3>
          {stats.monthlyGrowth.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-dark-400">
              <AlertCircle size={24} className="mb-2" />
              <p className="text-sm">No growth data yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.monthlyGrowth.map(item => {
                const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const label = `${monthNames[item._id.month]} ${item._id.year}`;
                const maxCount = Math.max(...stats.monthlyGrowth.map(g => g.count));
                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-sm text-dark-400 w-20">{label}</span>
                    <div className="flex-1 bg-dark-700 rounded-full h-6 relative">
                      <div
                        className="bg-red-500/80 h-6 rounded-full flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${Math.max((item.count / maxCount) * 100, 10)}%` }}
                      >
                        <span className="text-xs text-white font-medium">{item.count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Status */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Platform Health</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-dark-700/50 rounded-lg">
            <p className="text-2xl font-bold text-green-500">{stats.organizations.active}</p>
            <p className="text-xs text-dark-400 mt-1">Active Orgs</p>
          </div>
          <div className="text-center p-3 bg-dark-700/50 rounded-lg">
            <p className="text-2xl font-bold text-red-500">{stats.organizations.suspended}</p>
            <p className="text-xs text-dark-400 mt-1">Suspended</p>
          </div>
          <div className="text-center p-3 bg-dark-700/50 rounded-lg">
            <p className="text-2xl font-bold text-blue-500">{stats.users.active}</p>
            <p className="text-xs text-dark-400 mt-1">Active Users</p>
          </div>
          <div className="text-center p-3 bg-dark-700/50 rounded-lg">
            <p className="text-2xl font-bold text-amber-500">
              {stats.planDistribution.free || 0}
            </p>
            <p className="text-xs text-dark-400 mt-1">Free Tier</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

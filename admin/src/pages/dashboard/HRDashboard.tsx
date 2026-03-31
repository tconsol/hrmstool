import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Users,
  CalendarCheck,
  CalendarOff,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Clock,
} from 'lucide-react';
import type { DashboardStats, Leave, User } from '../../types';

const HRDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [departments, setDepartments] = useState<{ _id: string; count: number }[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<Leave[]>([]);
  const [recentEmployees, setRecentEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/dashboard/hr');
      setStats(data.stats);
      setDepartments(data.departments);
      setRecentLeaves(data.recentLeaves);
      setRecentEmployees(data.recentEmployees);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: Users,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10',
    },
    {
      label: 'Present Today',
      value: stats?.presentToday || 0,
      icon: CalendarCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Pending Leaves',
      value: stats?.pendingLeaves || 0,
      icon: CalendarOff,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Monthly Payroll',
      value: `₹${(stats?.payrollTotal || 0).toLocaleString()}`,
      icon: Wallet,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">HR Dashboard</h1>
        <p className="text-dark-400 text-sm mt-1">Overview of your organization</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-lg ${stat.bg}`}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <ArrowUpRight size={16} className="text-dark-500" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-dark-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-brand-400" />
            Department Distribution
          </h3>
          <div className="space-y-3">
            {departments.map((dept) => (
              <div key={dept._id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-500" />
                  <span className="text-sm text-dark-300">{dept._id || 'Unassigned'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 bg-dark-700 rounded-full h-2">
                    <div
                      className="bg-brand-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (dept.count / (stats?.totalEmployees || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white w-8 text-right">
                    {dept.count}
                  </span>
                </div>
              </div>
            ))}
            {departments.length === 0 && (
              <p className="text-sm text-dark-500 text-center py-4">No departments found</p>
            )}
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock size={20} className="text-amber-400" />
            Pending Leave Requests
          </h3>
          <div className="space-y-3">
            {recentLeaves.map((leave: any) => (
              <div
                key={leave._id}
                className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium text-white">{leave.user?.name}</p>
                  <p className="text-xs text-dark-400">
                    {leave.leaveType} • {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}
                  </p>
                </div>
                <span className="badge-warning">{leave.status}</span>
              </div>
            ))}
            {recentLeaves.length === 0 && (
              <p className="text-sm text-dark-500 text-center py-4">No pending requests</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Employees */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users size={20} className="text-brand-400" />
          Recent Employees
        </h3>
        <div className="table-container">
          <table className="table-dark">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Joining Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentEmployees.map((emp: any) => (
                <tr key={emp._id}>
                  <td className="font-mono text-xs">{emp.employeeId}</td>
                  <td className="font-medium text-white">{emp.name}</td>
                  <td>{emp.department || 'N/A'}</td>
                  <td>{new Date(emp.joiningDate).toLocaleDateString()}</td>
                  <td>
                    <span className={emp.status === 'active' ? 'badge-success' : 'badge-danger'}>
                      {emp.status}
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

export default HRDashboard;

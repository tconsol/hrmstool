import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Building2,
  Users,
  CalendarCheck,
  Wallet,
  PieChart,
  BarChart3,
  ArrowUpRight,
  CalendarOff,
  Clock,
} from 'lucide-react';

const ROLE_LABELS: Record<string, string> = { hr: 'HR', manager: 'Manager', ceo: 'CEO', employee: 'Employee' };
const ROLE_COLORS: Record<string, string> = { hr: 'bg-brand-500', manager: 'bg-cyan-500', ceo: 'bg-purple-500', employee: 'bg-emerald-500' };

const CEODashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [departments, setDepartments] = useState<{ _id: string; count: number; name: string }[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<{ _id: string; count: number }[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/dashboard/ceo');
      setStats(data.stats);
      setDepartments(data.departments || []);
      setRoleDistribution(data.roleDistribution || []);
      setRecentLeaves(data.recentLeaves || []);
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
    { label: 'Total Employees', value: stats?.totalEmployees || 0, sub: `${stats?.activeEmployees || 0} active`, icon: Users, color: 'text-brand-400', bg: 'bg-brand-500/10', link: '/admin/employees' },
    { label: 'Present Today', value: stats?.presentToday || 0, sub: `${stats?.attendanceRate || 0}% attendance rate`, icon: CalendarCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', link: '/admin/attendance' },
    { label: 'Pending Leaves', value: stats?.pendingLeaves || 0, sub: `${stats?.approvedLeaves || 0} approved this month`, icon: CalendarOff, color: 'text-amber-400', bg: 'bg-amber-500/10', link: '/admin/leaves' },
    { label: 'Monthly Payroll', value: `₹${(stats?.payrollTotal || 0).toLocaleString()}`, sub: `${stats?.payrollPaid || 0} paid / ${stats?.payrollPending || 0} pending`, icon: Wallet, color: 'text-purple-400', bg: 'bg-purple-500/10', link: '/admin/payroll' },
  ];

  const totalRoles = roleDistribution.reduce((a, r) => a + r.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
          <p className="text-dark-400 text-sm mt-0.5">Organization overview and KPIs</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-dark-400 bg-dark-700/50 px-3 py-1.5 rounded-lg">
            Depts: <span className="text-white font-bold">{departments.length}</span>
          </div>
          <div className="text-xs text-dark-400 bg-dark-700/50 px-3 py-1.5 rounded-lg">
            Active: <span className="text-emerald-400 font-bold">{stats?.activeEmployees || 0}</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <button key={card.label} onClick={() => navigate(card.link)} className="stat-card text-left w-full hover:ring-1 hover:ring-brand-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-lg ${card.bg}`}><card.icon size={20} className={card.color} /></div>
              <ArrowUpRight size={14} className="text-dark-500" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-sm text-dark-400">{card.label}</p>
              <p className="text-xs text-dark-500 mt-0.5">{card.sub}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart size={16} className="text-brand-400" />
            Department Distribution
          </h3>
          <div className="space-y-3">
            {departments.map((dept) => (
              <div key={dept._id} className="flex items-center gap-3">
                <span className="text-sm text-dark-300 w-40 truncate flex-shrink-0">{dept.name || 'Unassigned'}</span>
                <div className="flex-1 bg-dark-700 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (dept.count / (stats?.activeEmployees || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-white w-8 text-right flex-shrink-0">{dept.count}</span>
              </div>
            ))}
            {departments.length === 0 && <p className="text-sm text-dark-500 text-center py-4">No departments</p>}
          </div>
        </div>

        {/* Right column: Role distribution + Leave summary */}
        <div className="space-y-4">
          {/* Role Distribution */}
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <BarChart3 size={16} className="text-cyan-400" />
              Workforce by Role
            </h3>
            <div className="space-y-2.5">
              {roleDistribution.map(r => (
                <div key={r._id} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${ROLE_COLORS[r._id] || 'bg-dark-400'}`} />
                  <span className="text-sm text-dark-300 flex-1">{ROLE_LABELS[r._id] || r._id}</span>
                  <span className="text-sm font-bold text-white">{r.count}</span>
                  <div className="w-16 bg-dark-700 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${ROLE_COLORS[r._id] || 'bg-dark-400'}`} style={{ width: `${totalRoles ? (r.count / totalRoles) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leave Summary */}
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <CalendarOff size={16} className="text-amber-400" />
              Leave Summary (Month)
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-300">Pending</span>
                <span className="text-amber-400 font-bold">{stats?.pendingLeaves || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-300">Approved</span>
                <span className="text-emerald-400 font-bold">{stats?.approvedLeaves || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-300">Rejected</span>
                <span className="text-red-400 font-bold">{stats?.rejectedLeaves || 0}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-dark-700">
                <span className="text-sm text-dark-300">Payroll Paid</span>
                <span className="text-white font-bold">{stats?.payrollPaid || 0} / {stats?.payrollCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Leave Requests */}
      {recentLeaves.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              Pending Leave Requests
            </h3>
            <button onClick={() => navigate('/admin/leaves')} className="text-xs text-brand-400 hover:text-brand-300">View all</button>
          </div>
          <div className="table-container">
            <table className="table-dark">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th className="hidden md:table-cell">Department</th>
                  <th>Type</th>
                  <th className="hidden sm:table-cell">Period</th>
                  <th>Days</th>
                </tr>
              </thead>
              <tbody>
                {recentLeaves.map((leave: any) => (
                  <tr key={leave._id}>
                    <td>
                      <p className="font-medium text-white">{leave.user?.name || 'N/A'}</p>
                      <p className="text-xs text-dark-400">{leave.user?.employeeId}</p>
                    </td>
                    <td className="hidden md:table-cell text-dark-300">{leave.user?.department?.name || 'N/A'}</td>
                    <td className="capitalize text-dark-300">{leave.leaveType}</td>
                    <td className="hidden sm:table-cell text-dark-300 text-sm">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td className="text-white font-medium">{leave.totalDays}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Access */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold text-white mb-4">Quick Access</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={() => navigate('/admin/employees')} className="glass-card p-4 text-center hover:bg-dark-700 transition-colors cursor-pointer">
            <Users size={22} className="text-brand-400 mx-auto mb-2" />
            <p className="text-sm text-white font-medium">Employees</p>
          </button>
          <button onClick={() => navigate('/admin/departments')} className="glass-card p-4 text-center hover:bg-dark-700 transition-colors cursor-pointer">
            <Building2 size={22} className="text-cyan-400 mx-auto mb-2" />
            <p className="text-sm text-white font-medium">Departments</p>
          </button>
          <button onClick={() => navigate('/admin/payroll')} className="glass-card p-4 text-center hover:bg-dark-700 transition-colors cursor-pointer">
            <Wallet size={22} className="text-purple-400 mx-auto mb-2" />
            <p className="text-sm text-white font-medium">Payroll</p>
          </button>
          <button onClick={() => navigate('/admin/leaves')} className="glass-card p-4 text-center hover:bg-dark-700 transition-colors cursor-pointer">
            <CalendarCheck size={22} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-white font-medium">Leaves</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CEODashboard;

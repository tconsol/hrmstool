import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  UserCheck,
  UserX,
  DollarSign,
  Megaphone,
} from 'lucide-react';
import type { Leave, User } from '../../types';

const HRDashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [departments, setDepartments] = useState<{ _id: string; count: number; name: string }[]>([]);
  const [leaveByType, setLeaveByType] = useState<{ _id: string; count: number }[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<Leave[]>([]);
  const [recentEmployees, setRecentEmployees] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/dashboard/hr');
      setStats(data.stats);
      setDepartments(data.departments);
      setLeaveByType(data.leaveByType || []);
      setRecentLeaves(data.recentLeaves);
      setRecentEmployees(data.recentEmployees);
      setAnnouncements(data.announcements || []);
    } catch (error) {    } finally {
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
    { label: 'Present Today', value: stats?.presentToday || 0, sub: `${stats?.lateToday || 0} late`, icon: CalendarCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', link: '/admin/attendance' },
    { label: 'Pending Leaves', value: stats?.pendingLeaves || 0, sub: `${stats?.approvedLeavesMonth || 0} approved this month`, icon: CalendarOff, color: 'text-amber-400', bg: 'bg-amber-500/10', link: '/admin/leaves' },
    { label: 'Monthly Payroll', value: `₹${(stats?.payrollTotal || 0).toLocaleString()}`, sub: `${stats?.payrollPaid || 0} paid / ${stats?.payrollPending || 0} pending`, icon: Wallet, color: 'text-purple-400', bg: 'bg-purple-500/10', link: '/admin/payroll' },
  ];

  const leaveTypeLabel: Record<string, string> = { casual: 'Casual', sick: 'Sick', paid: 'Paid Annual' };
  const leaveTypeColor: Record<string, string> = { casual: 'bg-brand-500', sick: 'bg-red-500', paid: 'bg-emerald-500' };
  const totalLeaves = leaveByType.reduce((acc, l) => acc + l.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">HR Dashboard</h1>
          <p className="text-dark-400 text-sm mt-0.5">Overview of your organization</p>
        </div>
        <div className="text-xs text-dark-400 bg-dark-700/50 px-3 py-1.5 rounded-lg">
          Attendance Rate: <span className="text-emerald-400 font-bold text-sm">{stats?.attendanceRate || 0}%</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <button key={card.label} onClick={() => navigate(card.link)} className="stat-card text-left w-full hover:ring-1 hover:ring-brand-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-lg ${card.bg}`}>
                <card.icon size={20} className={card.color} />
              </div>
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
            <TrendingUp size={18} className="text-brand-400" />
            Department Distribution
          </h3>
          <div className="space-y-3">
            {departments.map((dept) => (
              <div key={dept._id} className="flex items-center gap-3">
                <span className="text-sm text-dark-300 w-36 truncate flex-shrink-0">{dept.name || 'Unassigned'}</span>
                <div className="flex-1 bg-dark-700 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (dept.count / (stats?.activeEmployees || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-white w-6 text-right flex-shrink-0">{dept.count}</span>
              </div>
            ))}
            {departments.length === 0 && <p className="text-sm text-dark-500 text-center py-4">No departments</p>}
          </div>
        </div>

        {/* Leave Breakdown + Payroll Status */}
        <div className="space-y-4">
          {/* Leave by Type */}
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <CalendarOff size={16} className="text-amber-400" />
              Leave This Month
            </h3>
            <div className="space-y-2.5">
              {leaveByType.length > 0 ? leaveByType.map(l => (
                <div key={l._id} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${leaveTypeColor[l._id] || 'bg-dark-400'}`} />
                  <span className="text-sm text-dark-300 flex-1">{leaveTypeLabel[l._id] || l._id}</span>
                  <span className="text-sm font-bold text-white">{l.count}</span>
                  <div className="w-16 bg-dark-700 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full ${leaveTypeColor[l._id] || 'bg-dark-400'}`} style={{ width: `${totalLeaves ? (l.count / totalLeaves) * 100 : 0}%` }} />
                  </div>
                </div>
              )) : <p className="text-xs text-dark-500 text-center py-2">No leaves this month</p>}
            </div>
          </div>

          {/* Payroll Status */}
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <DollarSign size={16} className="text-purple-400" />
              Payroll Status
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-300">Paid</span>
                <span className="text-emerald-400 font-bold text-sm">{stats?.payrollPaid || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-300">Pending</span>
                <span className="text-amber-400 font-bold text-sm">{stats?.payrollPending || 0}</span>
              </div>
              <div className="flex justify-between items-center border-t border-dark-700 pt-2 mt-2">
                <span className="text-sm text-dark-300">Total</span>
                <span className="text-white font-bold text-sm">₹{(stats?.payrollTotal || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Leave Requests */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              Pending Leave Requests
            </h3>
            <button onClick={() => navigate('/admin/leaves')} className="text-xs text-brand-400 hover:text-brand-300">
              View all
            </button>
          </div>
          <div className="space-y-2">
            {recentLeaves.map((leave: any) => (
              <div key={leave._id} className="flex items-center justify-between p-3 bg-dark-700/30 rounded-lg">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{leave.user?.name}</p>
                  <p className="text-xs text-dark-400">
                    {(leave.user?.department as any)?.name || 'N/A'} • {leave.leaveType} • {leave.totalDays}d
                  </p>
                </div>
                <span className="badge-warning ml-2 flex-shrink-0">pending</span>
              </div>
            ))}
            {recentLeaves.length === 0 && <p className="text-sm text-dark-500 text-center py-4">No pending requests</p>}
          </div>
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Megaphone size={16} className="text-brand-400" />
              Announcements
            </h3>
            <div className="space-y-3">
              {announcements.map((a: any) => (
                <div key={a._id} className="p-3 bg-dark-700/30 rounded-lg">
                  <p className="text-sm font-medium text-white">{a.title}</p>
                  <p className="text-xs text-dark-400 mt-0.5 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-dark-500 mt-1">{a.createdBy?.name} • {new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Employees */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Users size={16} className="text-brand-400" />
            Recent Employees
          </h3>
          <button onClick={() => navigate('/admin/employees')} className="text-xs text-brand-400 hover:text-brand-300">View all</button>
        </div>
        <div className="table-container">
          <table className="table-dark">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th className="hidden md:table-cell">Department</th>
                <th className="hidden lg:table-cell">Joining Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentEmployees.map((emp: any) => (
                <tr key={emp._id}>
                  <td className="font-mono text-xs">{emp.employeeId}</td>
                  <td className="font-medium text-white">{emp.name}</td>
                  <td className="hidden md:table-cell">{(emp.department as any)?.name || 'N/A'}</td>
                  <td className="hidden lg:table-cell">{new Date(emp.joiningDate).toLocaleDateString()}</td>
                  <td><span className={emp.status === 'active' ? 'badge-success' : 'badge-danger'}>{emp.status}</span></td>
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

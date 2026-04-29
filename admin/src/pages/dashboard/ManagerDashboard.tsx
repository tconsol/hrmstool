import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Users,
  CalendarCheck,
  CalendarOff,
  Wallet,
  PieChart,
  ArrowUpRight,
  Clock,
  UserCheck,
} from 'lucide-react';

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [departments, setDepartments] = useState<{ _id: string; count: number; name: string }[]>([]);
  const [leaveByType, setLeaveByType] = useState<{ _id: string; count: number }[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [recentLeaves, setRecentLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/dashboard/manager');
      setStats(data.stats);
      setDepartments(data.departments || []);
      setLeaveByType(data.leaveByType || []);
      setTeamMembers(data.teamMembers || []);
      setRecentLeaves(data.recentLeaves || []);
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
    { label: 'Present Today', value: stats?.presentToday || 0, sub: `${stats?.attendanceRate || 0}% attendance rate`, icon: CalendarCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10', link: '/admin/attendance' },
    { label: 'Pending Leaves', value: stats?.pendingLeaves || 0, sub: `${stats?.approvedLeavesMonth || 0} approved this month`, icon: CalendarOff, color: 'text-amber-400', bg: 'bg-amber-500/10', link: '/admin/leaves' },
    { label: 'Monthly Payroll', value: `₹${(stats?.payrollTotal || 0).toLocaleString()}`, sub: `${stats?.payrollPaid || 0} paid / ${stats?.payrollPending || 0} pending`, icon: Wallet, color: 'text-purple-400', bg: 'bg-purple-500/10', link: '/admin/payroll' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Manager Dashboard</h1>
          <p className="text-dark-400 text-sm mt-0.5">Organization overview and team performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-dark-400 bg-dark-700/50 px-3 py-1.5 rounded-lg">
            My Team: <span className="text-white font-bold">{stats?.teamSize || 0}</span>
          </div>
          <div className="text-xs text-dark-400 bg-dark-700/50 px-3 py-1.5 rounded-lg">
            Team Rate: <span className="text-emerald-400 font-bold">{stats?.teamMonthlyRate || 0}%</span>
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

        {/* Right column */}
        <div className="space-y-4">
          {/* Leave by Type */}
          <div className="glass-card p-5">
            <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <CalendarOff size={16} className="text-amber-400" />
              Leave by Type (Month)
            </h3>
            <div className="space-y-2">
              {leaveByType.length > 0 ? leaveByType.map((lt) => (
                <div key={lt._id} className="flex justify-between items-center">
                  <span className="text-sm text-dark-300 capitalize">{lt._id || 'Other'}</span>
                  <span className="text-sm font-bold text-white">{lt.count}</span>
                </div>
              )) : <p className="text-sm text-dark-500 text-center py-2">No leave data</p>}
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
                <span className="text-emerald-400 font-bold">{stats?.approvedLeavesMonth || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-dark-300">Rejected</span>
                <span className="text-red-400 font-bold">{stats?.rejectedLeavesMonth || 0}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-dark-700">
                <span className="text-sm text-dark-300">Payroll Paid</span>
                <span className="text-white font-bold">{stats?.payrollPaid || 0} / {stats?.payrollCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Leave Requests (Org-wide) */}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* My Team Section */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <UserCheck size={16} className="text-cyan-400" />
            My Team — Today's Attendance
          </h3>
          <span className="text-xs text-dark-400 bg-dark-700/50 px-2 py-1 rounded">
            Present: <span className="text-emerald-400 font-bold">{stats?.teamPresentToday || 0}</span> / {stats?.teamSize || 0}
          </span>
        </div>
        <div className="table-container">
          <table className="table-dark">
            <thead>
              <tr>
                <th>Name</th>
                <th className="hidden sm:table-cell">Designation</th>
                <th className="hidden md:table-cell">Check In</th>
                <th className="hidden md:table-cell">Check Out</th>
                <th className="hidden lg:table-cell">Mode</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.length > 0 ? (
                teamMembers.map((member: any) => {
                  const att = member.todayAttendance;
                  const statusColor = att?.status === 'present' ? 'bg-emerald-500/20 text-emerald-300'
                    : att?.status === 'late' ? 'bg-amber-500/20 text-amber-300'
                    : att?.status === 'absent' ? 'bg-red-500/20 text-red-300'
                    : 'bg-dark-600 text-dark-400';
                  const statusLabel = att?.status ? att.status.charAt(0).toUpperCase() + att.status.slice(1) : 'Not marked';
                  return (
                    <tr key={member._id}>
                      <td>
                        <p className="font-medium text-white">{member.name}</p>
                        <p className="text-xs text-dark-400">{member.employeeId}</p>
                      </td>
                      <td className="hidden sm:table-cell text-dark-300">
                        {typeof member.designation === 'object' ? member.designation?.name : member.designation || '-'}
                      </td>
                      <td className="hidden md:table-cell text-dark-300">
                        {att?.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="hidden md:table-cell text-dark-300">
                        {att?.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="hidden lg:table-cell">
                        {att?.checkInMode ? (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${att.checkInMode === 'remote' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-brand-500/20 text-brand-300'}`}>
                            {att.checkInMode === 'remote' ? 'Remote' : 'Office'}
                          </span>
                        ) : <span className="text-dark-500">-</span>}
                      </td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>{statusLabel}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-dark-500">No team members found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;

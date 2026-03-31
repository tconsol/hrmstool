import { useState, useEffect, FormEvent } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, CalendarOff } from 'lucide-react';

const MyLeaves = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState({ casual: 0, sick: 0, paid: 0 });
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [applying, setApplying] = useState(false);

  const [form, setForm] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/leaves/my');
      setLeaves(data.leaves);
      setLeaveBalance(data.leaveBalance);
    } catch (error) {
      toast.error('Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason) {
      toast.error('Please fill all fields');
      return;
    }
    setApplying(true);
    try {
      await api.post('/leaves/apply', form);
      toast.success('Leave applied successfully!');
      setShowApply(false);
      setForm({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to apply leave');
    } finally {
      setApplying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return 'badge-success';
      case 'rejected': return 'badge-danger';
      case 'pending': return 'badge-warning';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Leaves</h1>
          <p className="text-dark-400 text-sm mt-1">Apply and track your leave requests</p>
        </div>
        <button onClick={() => setShowApply(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Apply Leave
        </button>
      </div>

      {/* Leave Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card items-center">
          <p className="text-2xl font-bold text-emerald-400">{leaveBalance.casual}</p>
          <p className="text-sm text-dark-400">Casual Leave</p>
        </div>
        <div className="stat-card items-center">
          <p className="text-2xl font-bold text-blue-400">{leaveBalance.sick}</p>
          <p className="text-sm text-dark-400">Sick Leave</p>
        </div>
        <div className="stat-card items-center">
          <p className="text-2xl font-bold text-purple-400">{leaveBalance.paid}</p>
          <p className="text-sm text-dark-400">Paid Leave</p>
        </div>
      </div>

      {/* Leave History */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="table-container">
            <table className="table-dark">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Days</th>
                  <th className="hidden sm:table-cell">Reason</th>
                  <th>Status</th>
                  <th className="hidden md:table-cell">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave: any) => (
                  <tr key={leave._id}>
                    <td className="capitalize font-medium text-white">{leave.leaveType}</td>
                    <td className="text-xs">
                      {new Date(leave.startDate).toLocaleDateString()} -
                      {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td>{leave.totalDays}</td>
                    <td className="hidden sm:table-cell">
                      <p className="max-w-[200px] truncate">{leave.reason}</p>
                    </td>
                    <td><span className={getStatusBadge(leave.status)}>{leave.status}</span></td>
                    <td className="hidden md:table-cell text-xs">{leave.remarks || '-'}</td>
                  </tr>
                ))}
                {leaves.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-dark-500">
                      <CalendarOff className="mx-auto mb-2" size={24} />
                      No leave records
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApply && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleApply} className="glass-card p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-white">Apply for Leave</h3>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Leave Type</label>
              <select
                value={form.leaveType}
                onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                className="input-dark"
              >
                <option value="casual">Casual Leave ({leaveBalance.casual} remaining)</option>
                <option value="sick">Sick Leave ({leaveBalance.sick} remaining)</option>
                <option value="paid">Paid Leave ({leaveBalance.paid} remaining)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="input-dark"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="input-dark"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Reason</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="input-dark min-h-[80px]"
                placeholder="Reason for leave..."
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowApply(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={applying} className="btn-primary flex items-center gap-2">
                {applying && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Submit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MyLeaves;

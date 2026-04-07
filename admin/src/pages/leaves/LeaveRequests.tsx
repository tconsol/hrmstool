import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Check, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../../components/ui/Modal';

const LeaveRequests = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Remarks modal
  const [showRemarks, setShowRemarks] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [action, setAction] = useState<'approved' | 'rejected'>('approved');

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter, page]);



  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '15');
      if (statusFilter) params.set('status', statusFilter);

      const { data } = await api.get(`/leaves/all?${params.toString()}`);
      setLeaves(data.leaves);
      setTotalPages(data.pages);
    } catch (error) {
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (leave: any, actionType: 'approved' | 'rejected') => {
    setSelectedLeave(leave);
    setAction(actionType);
    setRemarks('');
    setShowRemarks(true);
  };

  const submitAction = async () => {
    try {
      await api.patch(`/leaves/${selectedLeave._id}/status`, {
        status: action,
        remarks,
      });
      toast.success(`Leave ${action}`);
      setShowRemarks(false);
      fetchLeaves();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Action failed');
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
      <div>
        <h1 className="text-2xl font-bold text-white">Leave Requests</h1>
        <p className="text-dark-400 text-sm mt-1">Review and manage leave applications</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', ''].map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === status
                ? 'bg-brand-600 text-white'
                : 'bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700'
            }`}
          >
            {status || 'All'}
          </button>
        ))}
      </div>

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
                  <th>Employee</th>
                  <th>Type</th>
                  <th className="hidden sm:table-cell">Period</th>
                  <th>Days</th>
                  <th className="hidden md:table-cell">Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave: any) => (
                  <tr key={leave._id}>
                    <td>
                      <div>
                        <p className="font-medium text-white">{leave.user?.name || 'N/A'}</p>
                        <p className="text-xs text-dark-400">
                          {typeof leave.user?.department === 'object' && leave.user?.department ? (leave.user.department as any).name : (leave.user?.department || 'N/A')}
                          {typeof leave.user?.designation === 'object' && leave.user?.designation ? ` • ${(leave.user.designation as any).name}` : (leave.user?.designation ? ` • ${leave.user.designation}` : '')}
                        </p>
                      </div>
                    </td>
                    <td className="capitalize">{leave.leaveType}</td>
                    <td className="hidden sm:table-cell text-xs">
                      {new Date(leave.startDate).toLocaleDateString()} -
                      {new Date(leave.endDate).toLocaleDateString()}
                    </td>
                    <td>{leave.totalDays}</td>
                    <td className="hidden md:table-cell">
                      <p className="max-w-[200px] truncate text-sm">{leave.reason}</p>
                    </td>
                    <td>
                      <span className={getStatusBadge(leave.status)}>{leave.status}</span>
                    </td>
                    <td>
                      {leave.status === 'pending' ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleAction(leave, 'approved')}
                            className="p-1.5 hover:bg-emerald-500/10 rounded-lg text-dark-400 hover:text-emerald-400 transition-colors"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleAction(leave, 'rejected')}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg text-dark-400 hover:text-red-400 transition-colors"
                            title="Reject"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-dark-500">
                          {leave.approvedBy?.name || '-'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-dark-500">
                      No leave requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700/50">
              <p className="text-sm text-dark-400">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-secondary p-2 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary p-2 disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Remarks Modal */}
      {showRemarks && (
        <Modal onClose={() => setShowRemarks(false)}>
          <div className="glass-card p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-white">
              {action === 'approved' ? 'Approve' : 'Reject'} Leave
            </h3>
            <p className="text-sm text-dark-400">
              {selectedLeave?.user?.name}'s {selectedLeave?.leaveType} leave for {selectedLeave?.totalDays} day(s)
            </p>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Remarks (optional)</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="input-dark min-h-[80px]"
                placeholder="Add remarks..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowRemarks(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={submitAction}
                className={action === 'approved' ? 'btn-success' : 'btn-danger'}
              >
                {action === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LeaveRequests;

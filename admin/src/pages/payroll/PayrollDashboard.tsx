import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Wallet, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import { useAuth } from '../../context/AuthContext';

const PayrollDashboard = () => {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { user } = useAuth();
  const isHR = user?.role === 'hr';

  // Generate form
  const [showGenerate, setShowGenerate] = useState(false);
  const [genMonth, setGenMonth] = useState(now.getMonth() + 1);
  const [genYear, setGenYear] = useState(now.getFullYear());
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchPayrolls();
    fetchSummary();
  }, [month, year, page]);



  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('month', String(month));
      params.set('year', String(year));
      params.set('page', String(page));
      params.set('limit', '15');

      const { data } = await api.get(`/payroll/list?${params.toString()}`);
      setPayrolls(data.payrolls);
      setTotalPages(data.pages);
    } catch (error) {
      toast.error('Failed to fetch payroll');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const { data } = await api.get(`/payroll/summary?month=${month}&year=${year}`);
      setSummary(data);
    } catch (error) {    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/payroll/generate', { month: genMonth, year: genYear });
      toast.success(data.message);
      setShowGenerate(false);
      fetchPayrolls();
      fetchSummary();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await api.patch(`/payroll/${id}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchPayrolls();
      fetchSummary();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'pending': return 'badge-warning';
      case 'hold': return 'badge-danger';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Payroll</h1>
          <p className="text-dark-400 text-sm mt-1">Manage employee salaries and payslips</p>
        </div>
        <button onClick={() => setShowGenerate(true)} className="btn-primary flex items-center gap-2" style={{ display: isHR ? undefined : 'none' }}>
          <DollarSign size={18} />
          Generate Payroll
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="text-sm text-dark-400">Total Payroll</p>
          <p className="text-2xl font-bold text-white">₹{(summary?.totalNetSalary || 0).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-dark-400">Total Deductions</p>
          <p className="text-2xl font-bold text-red-400">₹{(summary?.totalDeductions || 0).toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-dark-400">Paid</p>
          <p className="text-2xl font-bold text-emerald-400">{summary?.paidCount || 0}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-dark-400">Pending</p>
          <p className="text-2xl font-bold text-amber-400">{summary?.pendingCount || 0}</p>
        </div>
      </div>

      {/* Month/Year Filter */}
      <div className="glass-card p-4">
        <div className="flex gap-3">
          <Select
            value={String(month)}
            onChange={(v) => { setMonth(Number(v)); setPage(1); }}
            options={Array.from({ length: 12 }, (_, i) => ({
              value: String(i + 1),
              label: new Date(2000, i).toLocaleString('default', { month: 'long' }),
            }))}
            className="w-40"
          />
          <Select
            value={String(year)}
            onChange={(v) => { setYear(Number(v)); setPage(1); }}
            options={Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(y => ({
              value: String(y),
              label: String(y),
            }))}
            className="w-32"
          />
        </div>
      </div>

      {/* Payroll Table */}
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
                  <th>Base Salary</th>
                  <th className="hidden sm:table-cell">Deductions</th>
                  <th className="hidden md:table-cell">Bonuses</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p: any) => (
                  <tr key={p._id}>
                    <td>
                      <div>
                        <p className="font-medium text-white">{p.user?.name || 'N/A'}</p>
                        <p className="text-xs text-dark-400">
                          {p.user?.employeeId}
                          {typeof p.user?.department === 'object' && p.user?.department ? ` • ${(p.user.department as any).name}` : (p.user?.department ? ` • ${p.user.department}` : '')}
                        </p>
                      </div>
                    </td>
                    <td>₹{p.baseSalary?.toLocaleString()}</td>
                    <td className="hidden sm:table-cell text-red-400">-₹{p.totalDeductions?.toLocaleString()}</td>
                    <td className="hidden md:table-cell text-emerald-400">+₹{p.totalBonuses?.toLocaleString()}</td>
                    <td className="font-semibold text-white">₹{p.netSalary?.toLocaleString()}</td>
                    <td>
                      <span className={getPaymentBadge(p.paymentStatus)}>{p.paymentStatus}</span>
                    </td>
                    <td>
                      {isHR && p.paymentStatus === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(p._id, 'paid')}
                          className="text-xs btn-success py-1 px-2"
                        >
                          Mark Paid
                        </button>
                      )}
                      {p.paymentStatus === 'paid' && (
                        <span className="text-xs text-dark-500">
                          {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : 'Paid'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {payrolls.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-dark-500">
                      No payroll records for this month
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
                <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-secondary p-2 disabled:opacity-30">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="btn-secondary p-2 disabled:opacity-30">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generate Payroll Modal */}
      {showGenerate && (
        <Modal onClose={() => setShowGenerate(false)}>
          <div className="glass-card p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-white">Generate Monthly Payroll</h3>
            <p className="text-sm text-dark-400">
              This will generate payroll for all active employees for the selected month.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Month</label>
                <Select
                  value={String(genMonth)}
                  onChange={(v) => setGenMonth(Number(v))}
                  options={Array.from({ length: 12 }, (_, i) => ({
                    value: String(i + 1),
                    label: new Date(2000, i).toLocaleString('default', { month: 'long' }),
                  }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Year</label>
                <Select
                  value={String(genYear)}
                  onChange={(v) => setGenYear(Number(v))}
                  options={Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(y => ({
                    value: String(y),
                    label: String(y),
                  }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowGenerate(false)} className="btn-secondary">Cancel</button>
              <button onClick={handleGenerate} disabled={generating} className="btn-primary flex items-center gap-2">
                {generating && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                Generate
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PayrollDashboard;

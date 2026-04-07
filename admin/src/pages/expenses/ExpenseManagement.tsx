import { useState, useEffect } from 'react';
import { Receipt, CheckCircle, XCircle, DollarSign, Clock, TrendingUp, X } from 'lucide-react';
import api from '../../services/api';
import { Expense, User } from '../../types';
import toast from 'react-hot-toast';
import Select from '../../components/ui/Select';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  reimbursed: 'bg-blue-500/20 text-blue-400',
};

export default function ExpenseManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [remarkModal, setRemarkModal] = useState<{ id: string; action: string } | null>(null);
  const [remarks, setRemarks] = useState('');

  useEffect(() => { fetchAll(); }, [statusFilter]);

  const fetchAll = async () => {
    try {
      const [expRes, sumRes] = await Promise.all([
        api.get(`/expenses${statusFilter ? `?status=${statusFilter}` : ''}`),
        api.get('/expenses/summary'),
      ]);
      setExpenses(expRes.data.expenses || expRes.data);
      // Transform byStatus array into keyed object
      const byStatus = (sumRes.data.byStatus || []);
      const summaryObj: any = { total: 0, pending: 0, approved: 0, reimbursed: 0 };
      byStatus.forEach((s: any) => { summaryObj[s._id] = s.total; summaryObj.total += s.total; });
      setSummary(summaryObj);
    } catch { toast.error('Failed to fetch expenses'); }
    finally { setLoading(false); }
  };

  const handleAction = async (id: string, status: string) => {
    try {
      await api.patch(`/expenses/${id}/status`, { status, remarks });
      toast.success(`Expense ${status}`);
      setRemarkModal(null);
      setRemarks('');
      fetchAll();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Expense Management</h1>
          <p className="text-dark-400 text-sm mt-1">Review and manage employee expenses</p>
        </div>
        <div className="w-48">
          <Select
            value={statusFilter}
            onChange={val => setStatusFilter(val)}
            options={[
              { value: '', label: 'All Status' },
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'reimbursed', label: 'Reimbursed' },
            ]}
            placeholder="All Status"
          />
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-2 text-dark-400 text-sm"><Receipt className="w-4 h-4" /> Total Expenses</div>
            <p className="text-2xl font-bold text-white mt-1">₹{(summary.total || 0).toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 text-amber-400 text-sm"><Clock className="w-4 h-4" /> Pending</div>
            <p className="text-2xl font-bold text-amber-400 mt-1">₹{(summary.pending || 0).toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 text-green-400 text-sm"><CheckCircle className="w-4 h-4" /> Approved</div>
            <p className="text-2xl font-bold text-green-400 mt-1">₹{(summary.approved || 0).toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2 text-blue-400 text-sm"><TrendingUp className="w-4 h-4" /> Reimbursed</div>
            <p className="text-2xl font-bold text-blue-400 mt-1">₹{(summary.reimbursed || 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table-dark">
          <thead>
            <tr>
              <th className="px-5 py-3">Employee</th>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Description</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(e => {
              const emp = typeof e.employee === 'object' ? (e.employee as User) : null;
              return (
                <tr key={e._id}>
                  <td className="px-5 py-3 text-gray-300">{emp ? emp.name : '-'}</td>
                  <td className="px-5 py-3 text-dark-300 text-sm">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-dark-300 capitalize text-sm">{e.category.replace('_', ' ')}</td>
                  <td className="px-5 py-3 text-gray-300 font-medium">₹{e.amount.toLocaleString()}</td>
                  <td className="px-5 py-3 text-dark-400 text-sm max-w-xs truncate">{e.description}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[e.status]}`}>{e.status}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {e.status === 'pending' && (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setRemarkModal({ id: e._id, action: 'approved' }); setRemarks(''); }} className="p-1.5 text-green-400 hover:bg-dark-700 rounded-lg transition-colors" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => { setRemarkModal({ id: e._id, action: 'rejected' }); setRemarks(''); }} className="p-1.5 text-red-400 hover:bg-dark-700 rounded-lg transition-colors" title="Reject"><XCircle className="w-4 h-4" /></button>
                      </div>
                    )}
                    {e.status === 'approved' && (
                      <button onClick={() => handleAction(e._id, 'reimbursed')} className="btn-primary text-xs !px-2 !py-1"><DollarSign className="w-3 h-3 inline" /> Reimburse</button>
                    )}
                  </td>
                </tr>
              );
            })}
            {expenses.length === 0 && <tr><td colSpan={7} className="px-5 py-12 text-center text-dark-400">No expenses found</td></tr>}
          </tbody>
        </table>
      </div>

      {remarkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay" onClick={() => setRemarkModal(null)} />
          <div className="glass-card p-6 w-full max-w-sm relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{remarkModal.action === 'approved' ? 'Approve' : 'Reject'} Expense</h2>
              <button onClick={() => setRemarkModal(null)} className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Remarks</label>
                <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2} className="input-dark" placeholder="Optional remarks..." />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setRemarkModal(null)} className="btn-secondary">Cancel</button>
                <button onClick={() => handleAction(remarkModal.id, remarkModal.action)} className={`px-4 py-2.5 text-white rounded-lg font-medium transition-colors ${remarkModal.action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>{remarkModal.action === 'approved' ? 'Approve' : 'Reject'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

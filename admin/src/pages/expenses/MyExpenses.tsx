import { useState, useEffect } from 'react';
import { Receipt, Plus, Trash2, DollarSign, Clock, CheckCircle, XCircle, Upload, X } from 'lucide-react';
import api from '../../services/api';
import { Expense } from '../../types';
import toast from 'react-hot-toast';
import Select from '../../components/ui/Select';

const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  reimbursed: 'bg-blue-500/20 text-blue-400',
};

const statusIcons: Record<string, typeof Clock> = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  reimbursed: DollarSign,
};

const categories = ['travel', 'food', 'equipment', 'office_supplies', 'training', 'internet', 'phone', 'other'];

export default function MyExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: 'travel', amount: '', description: '', date: new Date().toISOString().split('T')[0], receipt: null as File | null });

  useEffect(() => { fetchExpenses(); }, []);

  const fetchExpenses = async () => {
    try {
      const { data } = await api.get('/expenses/my');
      setExpenses(data.expenses || data);
    } catch { toast.error('Failed to fetch expenses'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('category', form.category);
      formData.append('amount', form.amount);
      formData.append('description', form.description);
      formData.append('date', form.date);
      if (form.receipt) formData.append('receipt', form.receipt);
      await api.post('/expenses', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Expense submitted');
      setShowModal(false);
      setForm({ category: 'travel', amount: '', description: '', date: new Date().toISOString().split('T')[0], receipt: null });
      fetchExpenses();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try { await api.delete(`/expenses/${id}`); toast.success('Deleted'); fetchExpenses(); }
    catch { toast.error('Failed to delete'); }
  };

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const approvedAmount = expenses.filter(e => e.status === 'approved' || e.status === 'reimbursed').reduce((sum, e) => sum + e.amount, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Expenses</h1>
          <p className="text-dark-400 text-sm mt-1">{expenses.length} expenses submitted</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Submit Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="stat-card">
          <p className="text-dark-400 text-sm">Total Submitted</p>
          <p className="text-2xl font-bold text-white mt-1">₹{totalAmount.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-dark-400 text-sm">Approved / Reimbursed</p>
          <p className="text-2xl font-bold text-green-400 mt-1">₹{approvedAmount.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <p className="text-dark-400 text-sm">Pending</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">₹{expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="table-container">
        <table className="table-dark">
          <thead>
            <tr>
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
              const StatusIcon = statusIcons[e.status] || Clock;
              return (
                <tr key={e._id}>
                  <td className="px-5 py-3 text-dark-300 text-sm">{new Date(e.date).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-gray-300 capitalize">{e.category.replace('_', ' ')}</td>
                  <td className="px-5 py-3 text-gray-300 font-medium">₹{e.amount.toLocaleString()}</td>
                  <td className="px-5 py-3 text-dark-400 text-sm max-w-xs truncate">{e.description}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[e.status]}`}>
                      <StatusIcon className="w-3 h-3" /> {e.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {e.status === 'pending' && (
                      <button onClick={() => handleDelete(e._id)} className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </td>
                </tr>
              );
            })}
            {expenses.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-dark-400">No expenses submitted yet</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay" onClick={() => setShowModal(false)} />
          <div className="glass-card p-6 w-full max-w-md relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Submit Expense</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Category *</label>
                  <Select
                    value={form.category}
                    onChange={val => setForm({ ...form, category: val })}
                    options={categories.map(c => ({ value: c, label: c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) }))}
                    placeholder="Select category"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Amount *</label>
                  <input type="number" min={1} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input-dark" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-dark" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Description *</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input-dark" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Receipt</label>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-dark-300 cursor-pointer hover:bg-dark-600 transition-colors">
                    <Upload className="w-4 h-4" /> {form.receipt ? form.receipt.name : 'Choose file'}
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={e => setForm({ ...form, receipt: e.target.files?.[0] || null })} />
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

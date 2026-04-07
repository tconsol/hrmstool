import { useState, useEffect } from 'react';
import { Clock, Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../../services/api';
import { Shift } from '../../types';
import toast from 'react-hot-toast';

export default function ShiftList() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', startTime: '09:00', endTime: '18:00', graceMinutes: '15', isDefault: false });

  useEffect(() => { fetchShifts(); }, []);

  const fetchShifts = async () => {
    try {
      const { data } = await api.get('/shifts');
      setShifts(data);
    } catch { toast.error('Failed to fetch shifts'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, graceMinutes: Number(form.graceMinutes) };
      if (editId) {
        await api.put(`/shifts/${editId}`, payload);
        toast.success('Shift updated');
      } else {
        await api.post('/shifts', payload);
        toast.success('Shift created');
      }
      setShowModal(false);
      setEditId(null);
      setForm({ name: '', startTime: '09:00', endTime: '18:00', graceMinutes: '15', isDefault: false });
      fetchShifts();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = (s: Shift) => {
    setEditId(s._id);
    setForm({ name: s.name, startTime: s.startTime, endTime: s.endTime, graceMinutes: String(s.graceMinutes || 15), isDefault: s.isDefault || false });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this shift?')) return;
    try { await api.delete(`/shifts/${id}`); toast.success('Deleted'); fetchShifts(); }
    catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Shifts</h1>
          <p className="text-dark-400 text-sm mt-1">{shifts.length} shifts configured</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ name: '', startTime: '09:00', endTime: '18:00', graceMinutes: '15', isDefault: false }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Shift
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts.map(s => (
          <div key={s._id} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{s.name}</h3>
                    {s.isDefault && <span className="badge-success">Default</span>}
                  </div>
                  <p className="text-dark-400 text-sm mt-0.5">{s.startTime} – {s.endTime}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(s)} className="p-1.5 text-dark-400 hover:text-brand-400 hover:bg-dark-700/50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(s._id)} className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-dark-700/50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="mt-3 text-sm text-dark-400">
              Grace period: {s.graceMinutes || 15} min
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay" onClick={() => setShowModal(false)} />
          <div className="glass-card p-6 w-full max-w-md relative z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editId ? 'Edit' : 'Add'} Shift</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-dark-400 hover:text-white rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-dark" placeholder="e.g. Morning Shift" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Start Time *</label>
                  <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="input-dark" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">End Time *</label>
                  <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="input-dark" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Grace Minutes</label>
                <input type="number" min={0} value={form.graceMinutes} onChange={e => {
                  const v = e.target.value === '' ? 0 : Number(e.target.value);
                  setForm({ ...form, graceMinutes: v });
                }} className="input-dark" />
              </div>
              <label className="flex items-center gap-2 text-sm text-dark-300">
                <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="rounded border-dark-600 bg-dark-700 text-brand-500 focus:ring-brand-500" />
                Set as default shift
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

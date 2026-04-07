import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import api from '../../services/api';
import { Designation } from '../../types';
import toast from 'react-hot-toast';
import Select from '../../components/ui/Select';

export default function DesignationList() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', level: 'entry', description: '' });

  useEffect(() => { fetchDesignations(); }, []);

  const fetchDesignations = async () => {
    try {
      const { data } = await api.get('/designations');
      setDesignations(data);
    } catch { toast.error('Failed to fetch designations'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/designations/${editId}`, form);
        toast.success('Designation updated');
      } else {
        await api.post('/designations', form);
        toast.success('Designation created');
      }
      setShowModal(false);
      setEditId(null);
      setForm({ name: '', code: '', level: 'entry', description: '' });
      fetchDesignations();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = (d: Designation) => {
    setEditId(d._id);
    setForm({ name: d.name, code: d.code || '', level: d.level || 'entry', description: d.description || '' });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this designation?')) return;
    try { await api.delete(`/designations/${id}`); toast.success('Deleted'); fetchDesignations(); }
    catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Designations</h1>
          <p className="text-dark-400 text-sm mt-1">{designations.length} designations</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ name: '', code: '', level: 'entry', description: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Designation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {designations.map(d => (
          <div key={d._id} className="glass-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-white">{d.name}</h3>
                {d.code && <p className="text-xs text-dark-400">{d.code}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(d)} className="p-1.5 text-dark-400 hover:text-brand-400 hover:bg-dark-700/50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(d._id)} className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-dark-700/50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-dark-400 text-sm mb-2">{d.description}</p>
            <div className="flex items-center justify-between">
              <span className="inline-block px-2 py-1 rounded text-xs bg-brand-500/20 text-brand-400 capitalize">{d.level}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay" onClick={() => setShowModal(false)} />
          <div className="glass-card p-6 w-full max-w-sm relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{editId ? 'Edit' : 'New'} Designation</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-dark-400 hover:text-white rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-dark" required placeholder="Software Developer" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Code</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="input-dark" placeholder="SWD" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Level</label>
                <Select
                  value={form.level}
                  onChange={(val) => setForm({ ...form, level: val })}
                  options={[
                    { value: 'entry', label: 'Entry Level' },
                    { value: 'junior', label: 'Junior' },
                    { value: 'senior', label: 'Senior' },
                    { value: 'lead', label: 'Lead' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'executive', label: 'Executive' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="input-dark" placeholder="Job description..." />
              </div>
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

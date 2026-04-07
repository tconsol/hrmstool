import { useState, useEffect } from 'react';
import { Megaphone, Plus, Edit2, Trash2, AlertCircle, X } from 'lucide-react';
import api from '../../services/api';
import { Announcement, User } from '../../types';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';

const priorityColors: Record<string, string> = {
  low: 'bg-dark-500/30 text-dark-300',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-amber-500/20 text-amber-400',
  urgent: 'bg-red-500/20 text-red-400',
};

export default function AnnouncementList() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', priority: 'medium', targetRoles: [] as string[], expiresAt: '' });

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data } = await api.get('/announcements');
      setAnnouncements(data.announcements || []);
    } catch { toast.error('Failed to fetch announcements'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, expiresAt: form.expiresAt || null };
      if (editId) {
        await api.put(`/announcements/${editId}`, payload);
        toast.success('Announcement updated');
      } else {
        await api.post('/announcements', payload);
        toast.success('Announcement created');
      }
      setShowModal(false);
      setEditId(null);
      setForm({ title: '', content: '', priority: 'medium', targetRoles: [], expiresAt: '' });
      fetchAnnouncements();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = (a: Announcement) => {
    setEditId(a._id);
    setForm({
      title: a.title,
      content: a.content,
      priority: a.priority,
      targetRoles: a.targetRoles || [],
      expiresAt: a.expiresAt ? a.expiresAt.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    try { await api.delete(`/announcements/${id}`); toast.success('Deleted'); fetchAnnouncements(); }
    catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Announcements</h1>
          <p className="text-dark-400 text-sm mt-1">{announcements.length} announcements</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ title: '', content: '', priority: 'medium', targetRoles: [], expiresAt: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      <div className="space-y-4">
        {announcements.map(a => (
          <div key={a._id} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center mt-0.5">
                  {a.priority === 'urgent' ? <AlertCircle className="w-5 h-5 text-red-400" /> : <Megaphone className="w-5 h-5 text-brand-400" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{a.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${priorityColors[a.priority]}`}>{a.priority}</span>
                  </div>
                  <p className="text-dark-300 text-sm mt-1 whitespace-pre-wrap">{a.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-dark-400">
                    <span>By {typeof a.createdBy === 'object' ? (a.createdBy as User).name : 'Unknown'}</span>
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    {a.targetRoles.length > 0 && <span>For: {a.targetRoles.join(', ')}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(a)} className="p-1.5 text-dark-400 hover:text-brand-400 hover:bg-dark-700/50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(a._id)} className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-dark-700/50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {announcements.length === 0 && <div className="text-center text-dark-500 py-12">No announcements yet</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay" onClick={() => setShowModal(false)} />
          <div className="glass-card p-6 w-full max-w-lg relative z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editId ? 'Edit' : 'New'} Announcement</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-dark-400 hover:text-white rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-dark" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Content *</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} className="input-dark" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Priority</label>
                  <Select
                    value={form.priority}
                    onChange={(val) => setForm({ ...form, priority: val })}
                    options={[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'urgent', label: 'Urgent' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Expires</label>
                  <input type="date" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} className="input-dark" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editId ? 'Update' : 'Publish'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

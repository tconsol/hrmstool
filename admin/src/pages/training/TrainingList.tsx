import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Plus, Edit2, Trash2, Users, Calendar, UserPlus, X, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { Training } from '../../types';
import toast from 'react-hot-toast';
import Select from '../../components/ui/Select';
import DatePicker from '../../components/ui/DatePicker';
import { useAuth } from '../../context/AuthContext';

const statusColors: Record<string, string> = {
  upcoming: 'bg-blue-500/20 text-blue-400',
  ongoing: 'bg-green-500/20 text-green-400',
  completed: 'bg-dark-500/30 text-dark-300',
  cancelled: 'bg-red-500/20 text-red-400',
};

const trainingTypes = ['online', 'classroom', 'workshop', 'certification', 'onboarding'];

export default function TrainingList() {
  const { user } = useAuth();
  const canCreateTraining = user?.role && ['hr', 'manager', 'ceo'].includes(user.role);
  
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '', type: 'online', trainer: '', startDate: '', endDate: '', maxParticipants: '' });

  useEffect(() => { fetchTrainings(); }, []);

  const fetchTrainings = async () => {
    try {
      const { data } = await api.get('/training');
      setTrainings(data.trainings || data);
    } catch { toast.error('Failed to fetch trainings'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : undefined };
      if (editId) {
        await api.put(`/training/${editId}`, payload);
        toast.success('Training updated');
      } else {
        await api.post('/training', payload);
        toast.success('Training created');
      }
      setShowModal(false);
      setEditId(null);
      resetForm();
      fetchTrainings();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const resetForm = () => setForm({ title: '', description: '', type: 'online', trainer: '', startDate: '', endDate: '', maxParticipants: '' });

  const handleEdit = (t: Training) => {
    setEditId(t._id);
    let startDateStr = '';
    let endDateStr = '';
    
    if (t.startDate) {
      startDateStr = t.startDate.includes('T') ? t.startDate.split('T')[0] : new Date(t.startDate).toISOString().slice(0, 10);
    }
    if (t.endDate) {
      endDateStr = t.endDate.includes('T') ? t.endDate.split('T')[0] : new Date(t.endDate).toISOString().slice(0, 10);
    }
    
    setForm({ title: t.title, description: t.description || '', type: t.type, trainer: t.trainer || '', startDate: startDateStr, endDate: endDateStr, maxParticipants: t.maxParticipants ? String(t.maxParticipants) : '' });
    setShowModal(true);
  };

  const handleEnroll = async (id: string) => {
    try {
      await api.post(`/training/${id}/enroll`);
      toast.success('Enrolled successfully');
      fetchTrainings();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed to enroll'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this training?')) return;
    try { await api.delete(`/training/${id}`); toast.success('Deleted'); fetchTrainings(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Training Programs</h1>
          <p className="text-dark-400 text-sm mt-1">{trainings.length} programs</p>
        </div>
        {canCreateTraining && (
          <button onClick={() => { setEditId(null); resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Training
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trainings.map(t => {
          const userEnrolled = t.participants?.some((p: any) => p.user?._id === user?._id);
          return (
            <div key={t._id} className="glass-card p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white truncate">{t.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[t.status]} flex-shrink-0`}>{t.status}</span>
                    </div>
                    <span className="text-xs text-dark-400 capitalize">{t.type}</span>
                  </div>
                </div>

                {canCreateTraining && (
                  <div className="flex gap-1 flex-shrink-0 ml-2">
                    <button onClick={() => handleEdit(t)} className="p-1.5 text-dark-400 hover:text-brand-400 hover:bg-dark-700 rounded-lg transition-colors" title="Edit training">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(t._id)} className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-dark-700 rounded-lg transition-colors" title="Delete training">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {t.description && <p className="text-dark-400 text-sm mb-3 line-clamp-2">{t.description}</p>}
              
              <div className="space-y-1 text-sm text-dark-400 flex-1">
                {t.trainer && <p>Trainer: <span className="text-dark-300">{t.trainer}</span></p>}
                <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(t.startDate).toLocaleDateString()} – {new Date(t.endDate).toLocaleDateString()}</div>
                <div className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {t.participants?.length || 0}{t.maxParticipants ? ` / ${t.maxParticipants}` : ''} enrolled</div>
              </div>

              <div className="mt-4 flex gap-2">
                {(t.status === 'upcoming' || t.status === 'ongoing') && !userEnrolled && (
                  <button onClick={() => handleEnroll(t._id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg transition-colors">
                    <UserPlus className="w-3.5 h-3.5" /> Enroll
                  </button>
                )}
                {userEnrolled && (
                  <span className="flex-1 flex items-center justify-center px-3 py-1.5 text-sm bg-emerald-600/10 text-emerald-400 rounded-lg">
                    ✓ Enrolled
                  </span>
                )}

                <Link
                  to={`/training/${t._id}`}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 text-sm bg-dark-700 hover:bg-dark-600 border border-dark-600 text-dark-200 hover:text-white rounded-lg transition-colors"
                  title="View details"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> <span className="text-xs">View</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {trainings.length === 0 && (
        <div className="text-center text-dark-400 py-16">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No training programs yet</p>
          {canCreateTraining && <p className="text-xs mt-2">Click "Add Training" to create one</p>}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay" onClick={() => setShowModal(false)} />
          <div className="glass-card p-6 w-full max-w-lg relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">{editId ? 'Edit' : 'Add'} Training</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-dark" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input-dark" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Type</label>
                  <Select value={form.type} onChange={val => setForm({ ...form, type: val })} options={trainingTypes.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} placeholder="Select type" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Trainer</label>
                  <input value={form.trainer} onChange={e => setForm({ ...form, trainer: e.target.value })} className="input-dark" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Start Date *</label>
                  <DatePicker value={form.startDate} onChange={(val) => setForm({ ...form, startDate: val })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">End Date *</label>
                  <DatePicker value={form.endDate} onChange={(val) => setForm({ ...form, endDate: val })} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Max Seats</label>
                  <input type="number" min={1} value={form.maxParticipants} onChange={e => setForm({ ...form, maxParticipants: e.target.value })} className="input-dark" />
                </div>
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

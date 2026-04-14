import { useState, useEffect } from 'react';
import { CalendarDays, Plus, Edit2, Trash2, X, Globe, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useConfirm } from '../../context/ConfirmContext';
import { Holiday } from '../../types';
import Select from '../../components/ui/Select';
import DatePicker from '../../components/ui/DatePicker';

const typeColors: Record<string, string> = {
  national: 'bg-purple-500/20 text-purple-400',
  company: 'bg-blue-500/20 text-blue-400',
  optional: 'bg-amber-500/20 text-amber-400',
};

export default function HolidayList() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', date: '', type: 'company', description: '' });
  const [syncing, setSyncing] = useState(false);
  const confirm = useConfirm();

  useEffect(() => { fetchHolidays(); }, [year]);

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/holidays?year=${year}`);
      setHolidays(data);
    } catch { 
      toast.error('Failed to fetch holidays'); 
    } finally { 
      setLoading(false); 
    }
  };

  const syncIndiaHolidays = async () => {
    const ok = await confirm({
      title: 'Sync India Public Holidays',
      message: `This will fetch and store all India national holidays for ${year} from Google Calendar. Existing national holidays will be replaced.`,
      confirmLabel: 'Sync',
      variant: 'info',
    });
    
    if (!ok) return;

    setSyncing(true);
    try {
      const { data } = await api.post(`/holidays/sync/india`, { year });
      toast.success(data.message);
      fetchHolidays();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to sync holidays');
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/holidays/${editId}`, form);
        toast.success('Holiday updated');
      } else {
        await api.post('/holidays', form);
        toast.success('Holiday added');
      }
      setShowModal(false);
      setEditId(null);
      setForm({ name: '', date: '', type: 'company', description: '' });
      fetchHolidays();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = (h: Holiday) => {
    setEditId(h._id);
    setForm({ name: h.name, date: h.date.split('T')[0], type: h.type, description: h.description || '' });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Holiday',
      message: 'Are you sure you want to delete this holiday?',
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try { 
      await api.delete(`/holidays/${id}`); 
      toast.success('Holiday deleted'); 
      fetchHolidays(); 
    } catch { 
      toast.error('Failed to delete holiday'); 
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Holidays</h1>
          <p className="text-dark-400 text-sm mt-1">{holidays.length} holidays in {year}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            value={String(year)}
            onChange={(val) => setYear(Number(val))}
            options={[year - 1, year, year + 1].map(y => ({ value: String(y), label: String(y) }))}
          />
          <button 
            onClick={syncIndiaHolidays}
            disabled={syncing}
            title="Fetch and update India national holidays from Google Calendar"
            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            {syncing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Sync India Holidays
          </button>
          <button onClick={() => { setEditId(null); setForm({ name: '', date: '', type: 'company', description: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Holiday
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="table-dark">
          <thead>
            <tr>
              <th>Date</th>
              <th>Holiday</th>
              <th>Type</th>
              <th>Description</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {holidays.map(h => (
              <tr key={h._id}>
                <td>
                  <div className="flex items-center gap-2 text-white">
                    <CalendarDays className="w-4 h-4 text-dark-400" />
                    {new Date(h.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </div>
                </td>
                <td className="font-medium text-white">{h.name}</td>
                <td>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${typeColors[h.type] || typeColors.company}`}>{h.type}</span>
                </td>
                <td className="text-dark-400 text-sm">{h.description || '-'}</td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleEdit(h)} className="p-1.5 text-dark-400 hover:text-brand-400 hover:bg-dark-700/50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(h._id)} className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-dark-700/50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {holidays.length === 0 && (
              <tr><td colSpan={5} className="text-center text-dark-500 py-12">No holidays found for {year}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* India National & Public Holidays Section */}
      {holidays.filter(h => h.type === 'national').length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-dark-700/50">
            <Globe size={18} className="text-purple-400" />
            <div>
              <h2 className="text-base font-semibold text-white">India National & Public Holidays {year}</h2>
              <p className="text-xs text-dark-400 mt-0.5">Synced from Google Calendar</p>
            </div>
          </div>
          <div className="divide-y divide-dark-700/30">
            {holidays.filter(h => h.type === 'national').map((h) => {
              const dateObj = new Date(h.date);
              const weekday = dateObj.toLocaleDateString('en-IN', { weekday: 'long' });
              const formatted = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
              return (
                <div key={h._id} className="flex items-center gap-4 px-5 py-3 hover:bg-dark-700/20 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[11px] font-bold text-purple-300 leading-none">{String(dateObj.getDate()).padStart(2, '0')}</span>
                    <span className="text-[9px] text-purple-400 uppercase mt-0.5">{dateObj.toLocaleDateString('en-IN', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{h.name}</p>
                    <p className="text-xs text-dark-400">{weekday}, {formatted}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium flex-shrink-0">
                    National
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {holidays.filter(h => h.type === 'national').length === 0 && (
        <div className="glass-card p-6 text-center text-dark-400 space-y-2">
          <Globe size={24} className="mx-auto text-dark-500 mb-2" />
          <p className="text-sm">No India holidays synced yet for {year}</p>
          <p className="text-xs">Click the "Sync India Holidays" button above to fetch them from Google Calendar</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay" onClick={() => setShowModal(false)} />
          <div className="glass-card p-6 w-full max-w-md relative z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editId ? 'Edit' : 'Add'} Holiday</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-dark-400 hover:text-white rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-dark" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Date *</label>
                <DatePicker value={form.date} onChange={(val) => setForm({ ...form, date: val })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Type</label>
                <Select
                  value={form.type}
                  onChange={(val) => setForm({ ...form, type: val })}
                  options={[
                    { value: 'national', label: 'National' },
                    { value: 'company', label: 'Company' },
                    { value: 'optional', label: 'Optional' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-dark" />
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

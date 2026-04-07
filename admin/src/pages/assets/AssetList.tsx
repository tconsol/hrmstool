import { useState, useEffect } from 'react';
import { Monitor, Plus, Edit2, Trash2, UserPlus, X } from 'lucide-react';
import api from '../../services/api';
import { Asset, User } from '../../types';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  available: 'bg-green-500/20 text-green-400',
  assigned: 'bg-blue-500/20 text-blue-400',
  maintenance: 'bg-amber-500/20 text-amber-400',
  retired: 'bg-red-500/20 text-red-400',
};

const assetTypes = ['laptop', 'phone', 'monitor', 'keyboard', 'mouse', 'headset', 'chair', 'desk', 'id_card', 'other'];

export default function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [assignTo, setAssignTo] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({
    name: '', type: 'laptop', brand: '', model: '', serialNumber: '', purchaseDate: '', purchaseCost: '', warrantyExpiry: '', notes: '',
  });

  useEffect(() => { fetchAssets(); fetchEmployees(); }, [statusFilter]);

  const fetchAssets = async () => {
    try {
      const { data } = await api.get(`/assets${statusFilter ? `?status=${statusFilter}` : ''}`);
      setAssets(data.assets || data);
    } catch { toast.error('Failed to fetch assets'); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try { const { data } = await api.get('/employees?limit=200'); setEmployees(data.employees || []); } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...form, purchaseCost: form.purchaseCost ? Number(form.purchaseCost) : undefined };
      if (editId) {
        await api.put(`/assets/${editId}`, payload);
        toast.success('Asset updated');
      } else {
        await api.post('/assets', payload);
        toast.success('Asset added');
      }
      setShowModal(false);
      setEditId(null);
      resetForm();
      fetchAssets();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const resetForm = () => setForm({ name: '', type: 'laptop', brand: '', model: '', serialNumber: '', purchaseDate: '', purchaseCost: '', warrantyExpiry: '', notes: '' });

  const handleEdit = (a: Asset) => {
    setEditId(a._id);
    setForm({
      name: a.name, type: a.type, brand: a.brand || '', model: a.model || '',
      serialNumber: a.serialNumber || '', purchaseDate: a.purchaseDate ? a.purchaseDate.split('T')[0] : '',
      purchaseCost: a.purchaseCost ? String(a.purchaseCost) : '', warrantyExpiry: a.warrantyExpiry ? a.warrantyExpiry.split('T')[0] : '',
      notes: a.notes || '',
    });
    setShowModal(true);
  };

  const handleAssign = async () => {
    if (!assignModal) return;
    try {
      await api.patch(`/assets/${assignModal}/assign`, { assignedTo: assignTo || null });
      toast.success(assignTo ? 'Asset assigned' : 'Asset unassigned');
      setAssignModal(null);
      setAssignTo('');
      fetchAssets();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    try { await api.delete(`/assets/${id}`); toast.success('Deleted'); fetchAssets(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Assets</h1>
          <p className="text-dark-400 text-sm mt-1">{assets.length} assets</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'available', label: 'Available' },
              { value: 'assigned', label: 'Assigned' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'retired', label: 'Retired' },
            ]}
            placeholder="All Status"
          />
          <button onClick={() => { setEditId(null); resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Asset
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="table-dark">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Type</th>
              <th>Serial No.</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assets.map(a => {
              const assignee = typeof a.assignedTo === 'object' ? (a.assignedTo as User) : null;
              return (
                <tr key={a._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Monitor className="w-4 h-4 text-dark-400" />
                      <div>
                        <div className="text-white font-medium">{a.name}</div>
                        {a.brand && <div className="text-dark-400 text-xs">{a.brand} {a.model}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="capitalize text-sm">{a.type.replace('_', ' ')}</td>
                  <td className="text-sm font-mono">{a.serialNumber || '-'}</td>
                  <td className="text-sm">
                    {assignee ? (
                      <div>
                        <div className="text-white">{assignee.name}</div>
                        <div className="text-xs text-dark-400">
                          {typeof assignee.department === 'object' && assignee.department ? (assignee.department as any).name : (assignee.department || 'N/A')}
                        </div>
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColors[a.status]}`}>{a.status}</span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setAssignModal(a._id); setAssignTo(assignee?._id || ''); }} className="p-1.5 text-dark-400 hover:text-emerald-400 hover:bg-dark-700/50 rounded-lg transition-colors" title="Assign"><UserPlus className="w-4 h-4" /></button>
                      <button onClick={() => handleEdit(a)} className="p-1.5 text-dark-400 hover:text-brand-400 hover:bg-dark-700/50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(a._id)} className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-dark-700/50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {assets.length === 0 && <tr><td colSpan={6} className="text-center text-dark-500 py-12">No assets found</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay" onClick={() => setShowModal(false)} />
          <div className="glass-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto relative z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editId ? 'Edit' : 'Add'} Asset</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-dark-400 hover:text-white rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Name *</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-dark" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Type</label>
                  <Select
                    value={form.type}
                    onChange={(val) => setForm({ ...form, type: val })}
                    options={assetTypes.map(t => ({ value: t, label: t.replace('_', ' ') }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Brand</label>
                  <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} className="input-dark" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Model</label>
                  <input value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} className="input-dark" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Serial Number</label>
                <input value={form.serialNumber} onChange={e => setForm({ ...form, serialNumber: e.target.value })} className="input-dark" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Purchase Date</label>
                  <input type="date" value={form.purchaseDate} onChange={e => setForm({ ...form, purchaseDate: e.target.value })} className="input-dark" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Cost</label>
                  <input type="number" min={0} value={form.purchaseCost} onChange={e => setForm({ ...form, purchaseCost: e.target.value })} className="input-dark" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-1.5">Warranty Until</label>
                  <input type="date" value={form.warrantyExpiry} onChange={e => setForm({ ...form, warrantyExpiry: e.target.value })} className="input-dark" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="input-dark" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay" onClick={() => setAssignModal(null)} />
          <div className="glass-card p-6 w-full max-w-sm relative z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">Assign Asset</h2>
              <button onClick={() => setAssignModal(null)} className="p-1 text-dark-400 hover:text-white rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Employee</label>
                <Select
                  value={assignTo}
                  onChange={setAssignTo}
                  options={employees.map(emp => ({ value: emp._id, label: `${emp.name} (${emp.employeeId})` }))}
                  placeholder="Unassign"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setAssignModal(null)} className="btn-secondary">Cancel</button>
                <button onClick={handleAssign} className="btn-primary">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

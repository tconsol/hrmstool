import { useState, useEffect } from 'react';
import { Building2, Plus, Edit2, Trash2, Users, X } from 'lucide-react';
import api from '../../services/api';
import { Department, User } from '../../types';
import Select from '../../components/ui/Select';
import toast from 'react-hot-toast';

export default function DepartmentList() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', head: '' });

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data } = await api.get('/departments');
      setDepartments(data);
    } catch { toast.error('Failed to fetch departments'); }
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/employees?limit=100');
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/departments/${editId}`, form);
        toast.success('Department updated');
      } else {
        await api.post('/departments', form);
        toast.success('Department created');
      }
      setShowModal(false);
      setEditId(null);
      setForm({ name: '', code: '', description: '', head: '' });
      fetchDepartments();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    }
  };

  const handleEdit = (dept: Department) => {
    setEditId(dept._id);
    setForm({
      name: dept.name,
      code: dept.code || '',
      description: dept.description || '',
      head: typeof dept.head === 'object' && dept.head ? dept.head._id : (dept.head || ''),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department?')) return;
    try {
      await api.delete(`/departments/${id}`);
      toast.success('Department deleted');
      fetchDepartments();
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Departments</h1>
          <p className="text-dark-400 text-sm mt-1">{departments.length} departments</p>
        </div>
        <button onClick={() => { setEditId(null); setForm({ name: '', code: '', description: '', head: '' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map(dept => (
          <div key={dept._id} className="glass-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{dept.name}</h3>
                  {dept.code && <span className="text-xs text-dark-400 bg-dark-700 px-2 py-0.5 rounded">{dept.code}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(dept)} className="p-1.5 text-dark-400 hover:text-brand-400 hover:bg-dark-700/50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(dept._id)} className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-dark-700/50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            {dept.description && <p className="text-dark-400 text-sm mt-3 line-clamp-2">{dept.description}</p>}
            {typeof dept.head === 'object' && dept.head && (
              <div className="flex items-center gap-2 mt-3 text-sm text-dark-300">
                <Users className="w-4 h-4 text-dark-400" />
                <span>Head: {dept.head.name}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay" onClick={() => setShowModal(false)} />
          <div className="glass-card p-6 w-full max-w-md relative z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white">{editId ? 'Edit' : 'Add'} Department</h2>
              <button onClick={() => setShowModal(false)} className="p-1 text-dark-400 hover:text-white rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-dark" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Code</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="input-dark" placeholder="e.g. ENG" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="input-dark" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Department Head</label>
                <Select
                  value={form.head}
                  onChange={(val) => setForm({ ...form, head: val })}
                  options={employees.map(emp => ({ value: emp._id, label: `${emp.name} (${emp.employeeId})` }))}
                  placeholder="None"
                />
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

import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';

const EmployeeForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'employee',
    department: '',
    designation: '',
    salary: '',
    joiningDate: new Date().toISOString().split('T')[0],
    address: '',
  });

  useEffect(() => {
    if (isEdit) {
      fetchEmployee();
    }
  }, [id]);

  const fetchEmployee = async () => {
    try {
      const { data } = await api.get(`/employees/${id}`);
      setForm({
        name: data.name || '',
        email: data.email || '',
        password: '',
        phone: data.phone || '',
        role: data.role || 'employee',
        department: data.department || '',
        designation: data.designation || '',
        salary: data.salary?.toString() || '',
        joiningDate: data.joiningDate?.split('T')[0] || '',
        address: data.address || '',
      });
    } catch (error) {
      toast.error('Failed to fetch employee');
      navigate('/employees');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = { ...form, salary: Number(form.salary) || 0 };
      if (isEdit) {
        const { password, ...updateData } = payload;
        await api.put(`/employees/${id}`, updateData);
        toast.success('Employee updated successfully');
      } else {
        if (!payload.password) {
          toast.error('Password is required');
          setLoading(false);
          return;
        }
        await api.post('/employees', payload);
        toast.success('Employee added successfully');
      }
      navigate('/employees');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/employees')}
          className="p-2 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isEdit ? 'Edit Employee' : 'Add Employee'}
          </h1>
          <p className="text-dark-400 text-sm mt-1">
            {isEdit ? 'Update employee information' : 'Add a new team member'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Full Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input-dark"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Email *</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="input-dark"
              placeholder="john@company.com"
              required
            />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Password *</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="input-dark"
                placeholder="Min 6 characters"
                minLength={6}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="input-dark"
              placeholder="9876543210"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Role</label>
            <select name="role" value={form.role} onChange={handleChange} className="input-dark">
              <option value="employee">Employee</option>
              <option value="hr">HR / Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Department</label>
            <input
              name="department"
              value={form.department}
              onChange={handleChange}
              className="input-dark"
              placeholder="Engineering"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Designation</label>
            <input
              name="designation"
              value={form.designation}
              onChange={handleChange}
              className="input-dark"
              placeholder="Software Developer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Salary (₹)</label>
            <input
              name="salary"
              type="number"
              value={form.salary}
              onChange={handleChange}
              className="input-dark"
              placeholder="50000"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Joining Date</label>
            <input
              name="joiningDate"
              type="date"
              value={form.joiningDate}
              onChange={handleChange}
              className="input-dark"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-300 mb-1.5">Address</label>
          <textarea
            name="address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="input-dark min-h-[80px] resize-y"
            placeholder="Full address"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-dark-700/50">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {isEdit ? 'Update' : 'Add'} Employee
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;

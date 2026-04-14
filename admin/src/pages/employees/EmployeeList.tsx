import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  UserCheck,
  UserX,
  Edit,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { User } from '../../types';
import Select from '../../components/ui/Select';
import { useAuth } from '../../context/AuthContext';
import { useConfirm } from '../../context/ConfirmContext';

const EmployeeList = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [departments, setDepartments] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();
  const { user } = useAuth();
  const confirm = useConfirm();
  const isHR = ['hr', 'ceo', 'manager'].includes(user?.role ?? '');

  useEffect(() => {
    fetchEmployees();
  }, [page, search, statusFilter, departmentFilter]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (departmentFilter) params.set('department', departmentFilter);

      const { data } = await api.get(`/employees?${params.toString()}`);
      setEmployees(data.employees);
      setTotalPages(data.pages);
      
      // Extract unique department names from employees
      const uniqueDepts = [...new Set(
        data.employees
          .map((emp: any) => typeof emp.department === 'object' ? emp.department?.name : emp.department)
          .filter(Boolean)
      )] as string[];
      setDepartments(uniqueDepts.sort());
    } catch (error) {
      toast.error('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (emp: User) => {
    const isActive = emp.status === 'active';
    const ok = await confirm({
      title: isActive ? 'Deactivate Employee' : 'Activate Employee',
      message: isActive
        ? `Are you sure you want to deactivate ${emp.name}? They will lose access to the system.`
        : `Are you sure you want to activate ${emp.name}? They will regain access to the system.`,
      confirmLabel: isActive ? 'Deactivate' : 'Activate',
      variant: isActive ? 'danger' : 'info',
    });
    if (!ok) return;
    try {
      await api.patch(`/employees/${emp._id}/toggle-status`);
      toast.success('Status updated');
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees</h1>
          <p className="text-dark-400 text-sm mt-1">Manage your team members</p>
        </div>
        <button
          onClick={() => navigate('/employees/add')}
          className="btn-primary flex items-center gap-2"
          style={{ display: isHR ? undefined : 'none' }}
        >
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-dark pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(v) => { setStatusFilter(v); setPage(1); }}
            placeholder="All Status"
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            className="w-full sm:w-40"
          />
          <Select
            value={departmentFilter}
            onChange={(v) => { setDepartmentFilter(v); setPage(1); }}
            placeholder="All Departments"
            options={departments.map(d => ({ value: d, label: d }))}
            className="w-full sm:w-48"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="table-container">
            <table className="table-dark">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th className="hidden md:table-cell">Department</th>
                  <th className="hidden lg:table-cell">Designation</th>
                  <th className="hidden sm:table-cell">Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {(emp as any).profilePicture?.url ? (
                          <img
                            src={(emp as any).profilePicture.url}
                            alt={emp.name}
                            className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-brand-600/20 flex items-center justify-center text-sm font-semibold text-brand-400 flex-shrink-0">
                            {emp.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-white">{emp.name}</p>
                          <p className="text-xs text-dark-400">{emp.employeeId} • {emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">{typeof emp.department === 'object' && emp.department ? (emp.department as any).name : (emp.department || 'N/A')}</td>
                    <td className="hidden lg:table-cell">{typeof emp.designation === 'object' && emp.designation ? (emp.designation as any).name : (emp.designation || 'N/A')}</td>
                    <td className="hidden sm:table-cell">₹{emp.salary?.toLocaleString()}</td>
                    <td>
                      <span className={emp.status === 'active' ? 'badge-success' : 'badge-danger'}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/employees/${emp._id}`)}
                          className="p-1.5 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-blue-400 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        {isHR && (
                          <>
                            <button
                              onClick={() => navigate(`/employees/edit/${emp._id}`)}
                              className="p-1.5 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-brand-400 transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => navigate(`/employees/${emp._id}/documents`)}
                              className="p-1.5 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-emerald-400 transition-colors"
                              title="Documents"
                            >
                              <FileText size={16} />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(emp)}
                              className={`p-1.5 hover:bg-dark-700/50 rounded-lg transition-colors ${
                                emp.status === 'active'
                                  ? 'text-dark-400 hover:text-red-400'
                                  : 'text-dark-400 hover:text-emerald-400'
                              }`}
                              title={emp.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {emp.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>
                          </>
                        )}
                        {!isHR && (
                          <>
                            <button
                              onClick={() => navigate(`/employees/${emp._id}`)}
                              className="p-1.5 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-blue-400 transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => navigate(`/employees/${emp._id}/documents`)}
                              className="p-1.5 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-emerald-400 transition-colors"
                              title="Documents"
                            >
                              <FileText size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-dark-500">
                      No employees found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700/50">
              <p className="text-sm text-dark-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn-secondary p-2 disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary p-2 disabled:opacity-30"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeList;

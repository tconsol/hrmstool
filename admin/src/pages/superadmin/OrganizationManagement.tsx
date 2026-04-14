import { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Building2,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  X,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from '../../components/ui/Select';
import { useConfirm } from '../../context/ConfirmContext';

interface OrgData {
  _id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  industry: string;
  isActive: boolean;
  verificationStatus?: string;
  subscription: {
    plan: string;
    startDate: string;
    endDate: string;
    maxEmployees: number;
  };
  createdAt: string;
  actualEmployeeCount: number;
}

interface PendingOrg {
  _id: string;
  name: string;
  email: string;
  phone: string;
  industry: string;
  verificationStatus: string;
  createdAt: string;
  creator?: { name: string; email: string; phone: string } | null;
}

interface OrgDetails {
  organization: OrgData;
  stats: {
    employeeCount: number;
    departmentCount: number;
    roleDistribution: Array<{ _id: string; count: number }>;
  };
  recentUsers: Array<{ _id: string; name: string; email: string; role: string; status: string; createdAt: string }>;
}

const OrganizationManagement = () => {
  const confirm = useConfirm();
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [organizations, setOrganizations] = useState<OrgData[]>([]);
  const [pendingOrgs, setPendingOrgs] = useState<PendingOrg[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrg, setSelectedOrg] = useState<OrgDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
    fetchPendingOrganizations();
  }, [page, statusFilter, planFilter]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (planFilter) params.plan = planFilter;

      const { data } = await api.get('/superadmin/organizations', { params });
      setOrganizations(data.organizations);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      toast.error('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrganizations();
  };

  const fetchPendingOrganizations = async () => {
    try {
      setPendingLoading(true);
      const { data } = await api.get('/superadmin/organizations/pending');
      setPendingOrgs(data.organizations);
    } catch (error) {
      // Silently fail for pending orgs
    } finally {
      setPendingLoading(false);
    }
  };

  const approveOrganization = async (id: string) => {
    try {
      const { data } = await api.patch(`/superadmin/organizations/${id}/approve`);
      toast.success(data.message);
      fetchPendingOrganizations();
      fetchOrganizations();
    } catch (error) {
      toast.error('Failed to approve organization');
    }
  };

  const rejectOrganization = async (id: string) => {
    try {
      const { data } = await api.patch(`/superadmin/organizations/${id}/reject`);
      toast.success(data.message);
      fetchPendingOrganizations();
      fetchOrganizations();
    } catch (error) {
      toast.error('Failed to reject organization');
    }
  };

  const toggleStatus = async (id: string) => {
    const org = organizations.find((o) => o._id === id);
    const isActive = org?.isActive ?? true;
    const ok = await confirm({
      title: isActive ? 'Deactivate Organization' : 'Activate Organization',
      message: isActive
        ? `Are you sure you want to deactivate "${org?.name || 'this organization'}"? All users will lose access.`
        : `Are you sure you want to activate "${org?.name || 'this organization'}"? Users will regain access.`,
      confirmLabel: isActive ? 'Deactivate' : 'Activate',
      variant: isActive ? 'danger' : 'info',
    });
    if (!ok) return;
    try {
      const { data } = await api.patch(`/superadmin/organizations/${id}/status`);
      toast.success(data.message);
      fetchOrganizations();
      if (selectedOrg?.organization._id === id) {
        viewDetails(id);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const viewDetails = async (id: string) => {
    try {
      setDetailsLoading(true);
      const { data } = await api.get(`/superadmin/organizations/${id}`);
      setSelectedOrg(data);
    } catch (error) {
      toast.error('Failed to load details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/superadmin/organizations/${id}`);
      toast.success('Organization deleted');
      setDeleteConfirm(null);
      setSelectedOrg(null);
      fetchOrganizations();
    } catch (error) {
      toast.error('Failed to delete organization');
    }
  };

  const planBadgeColor: Record<string, string> = {
    free: 'bg-gray-500/20 text-gray-400',
    starter: 'bg-blue-500/20 text-blue-400',
    professional: 'bg-purple-500/20 text-purple-400',
    enterprise: 'bg-amber-500/20 text-amber-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Organizations</h1>
          <p className="text-dark-400 mt-1">Manage all registered organizations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 rounded-lg p-1 border border-dark-700 w-fit">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'all' ? 'bg-brand-600 text-white' : 'text-dark-400 hover:text-white'
          }`}
        >
          All Organizations
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'pending' ? 'bg-amber-600 text-white' : 'text-dark-400 hover:text-white'
          }`}
        >
          <Clock size={16} />
          Pending Approval
          {pendingOrgs.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {pendingOrgs.length}
            </span>
          )}
        </button>
      </div>

      {/* Pending Approvals Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingLoading ? (
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-12 text-center">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : pendingOrgs.length === 0 ? (
            <div className="bg-dark-800 rounded-xl border border-dark-700 p-12 text-center">
              <CheckCircle2 size={48} className="mx-auto text-green-400 mb-3" />
              <p className="text-dark-400">No pending organizations to review</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingOrgs.map(org => (
                <div key={org._id} className="bg-dark-800 rounded-xl border border-dark-700 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                          <Building2 size={20} className="text-amber-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{org.name}</h3>
                          <p className="text-xs text-dark-400">Registered {new Date(org.createdAt).toLocaleDateString()} at {new Date(org.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        <div>
                          <p className="text-xs text-dark-500">Organization Email</p>
                          <p className="text-sm text-dark-300">{org.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-500">Phone</p>
                          <p className="text-sm text-dark-300">{org.phone || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-500">Industry</p>
                          <p className="text-sm text-dark-300">{org.industry || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-dark-500">CEO</p>
                          <p className="text-sm text-dark-300">{org.creator?.name || '-'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => approveOrganization(org._id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <CheckCircle2 size={16} /> Approve
                      </button>
                      <button
                        onClick={() => rejectOrganization(org._id)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium rounded-lg transition-colors"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Organizations Tab */}
      {activeTab === 'all' && (
        <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search organizations..."
              className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </form>
        <div className="w-40">
          <Select
            value={statusFilter}
            onChange={val => { setStatusFilter(val); setPage(1); }}
            options={[
              { value: '', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'suspended', label: 'Suspended' },
            ]}
            placeholder="All Status"
          />
        </div>
        <div className="w-40">
          <Select
            value={planFilter}
            onChange={val => { setPlanFilter(val); setPage(1); }}
            options={[
              { value: '', label: 'All Plans' },
              { value: 'free', label: 'Free' },
              { value: 'starter', label: 'Starter' },
              { value: 'professional', label: 'Professional' },
              { value: 'enterprise', label: 'Enterprise' },
            ]}
            placeholder="All Plans"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Organization</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Employees</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Created</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-dark-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : organizations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-dark-400">No organizations found</td>
                </tr>
              ) : (
                organizations.map(org => (
                  <tr key={org._id} className="border-b border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-white">{org.name}</p>
                        <p className="text-xs text-dark-400">{org.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${planBadgeColor[org.subscription?.plan] || planBadgeColor.free}`}>
                        {org.subscription?.plan || 'free'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-dark-300">{org.actualEmployeeCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        org.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {org.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-dark-400">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => viewDetails(org._id)}
                          className="p-1.5 rounded-lg text-dark-400 hover:bg-dark-600 hover:text-white"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => toggleStatus(org._id)}
                          className={`p-1.5 rounded-lg ${
                            org.isActive ? 'text-green-400 hover:bg-green-500/10' : 'text-red-400 hover:bg-red-500/10'
                          }`}
                          title={org.isActive ? 'Suspend' : 'Activate'}
                        >
                          {org.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(org._id)}
                          className="p-1.5 rounded-lg text-dark-400 hover:bg-red-500/10 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700">
            <p className="text-sm text-dark-400">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-dark-400 hover:bg-dark-700 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-dark-400 hover:bg-dark-700 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* Details Modal */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay" onClick={() => setSelectedOrg(null)} />
          <div className="bg-dark-800 rounded-xl border border-dark-700 w-full max-w-2xl flex flex-col max-h-[90vh] relative z-10" onClick={e => e.stopPropagation()}>
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700 flex-shrink-0">
              <h3 className="text-lg font-bold text-white">{selectedOrg.organization.name}</h3>
              <button onClick={() => setSelectedOrg(null)} className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors flex-shrink-0">
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {detailsLoading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-dark-400 mb-1">Email</p>
                      <p className="text-sm text-white">{selectedOrg.organization.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-400 mb-1">Industry</p>
                      <p className="text-sm text-white">{selectedOrg.organization.industry || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-400 mb-1">Plan</p>
                      <p className="text-sm text-white capitalize">{selectedOrg.organization.subscription?.plan || 'free'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-400 mb-1">Status</p>
                      <p className={`text-sm ${selectedOrg.organization.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedOrg.organization.isActive ? 'Active' : 'Suspended'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-400 mb-1">Employees</p>
                      <p className="text-sm text-white">{selectedOrg.stats.employeeCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-400 mb-1">Departments</p>
                      <p className="text-sm text-white">{selectedOrg.stats.departmentCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-400 mb-1">Max Employees</p>
                      <p className="text-sm text-white">{selectedOrg.organization.subscription?.maxEmployees || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-400 mb-1">Subscription Ends</p>
                      <p className="text-sm text-white">
                        {selectedOrg.organization.subscription?.endDate
                          ? new Date(selectedOrg.organization.subscription.endDate).toLocaleDateString()
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Role Distribution */}
                  <div>
                    <p className="text-xs text-dark-400 mb-2">Role Distribution</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrg.stats.roleDistribution.map(r => (
                        <span key={r._id} className="px-2 py-1 bg-brand-500/10 text-brand-400 rounded-lg text-xs font-medium">
                          {r._id}: {r.count}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recent Users */}
                  <div>
                    <p className="text-xs text-dark-400 mb-2">Recent Users</p>
                    <div className="space-y-2">
                      {selectedOrg.recentUsers.map(u => (
                        <div key={u._id} className="flex items-center justify-between p-2 bg-dark-700/50 rounded-lg">
                          <div>
                            <p className="text-sm text-white">{u.name}</p>
                            <p className="text-xs text-dark-400">{u.email}</p>
                          </div>
                          <span className="text-xs text-dark-400 capitalize">{u.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Footer */}
            <div className="px-6 py-4 border-t rounded-b-xl border-dark-700 bg-dark-800/50 backdrop-blur flex-shrink-0">
              <button
                onClick={() => toggleStatus(selectedOrg.organization._id)}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedOrg.organization.isActive
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                }`}
              >
                {selectedOrg.organization.isActive ? 'Suspend Organization' : 'Activate Organization'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)} />
          <div className="glass-card p-6 w-full max-w-sm relative z-10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Delete Organization</h3>
                  <p className="text-sm text-dark-400">This will permanently delete all data</p>
                </div>
              </div>
              <button onClick={() => setDeleteConfirm(null)} className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex gap-3 pt-4 border-t border-dark-700">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-4 py-2.5 flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationManagement;

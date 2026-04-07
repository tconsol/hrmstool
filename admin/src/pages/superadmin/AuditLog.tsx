import { useState, useEffect } from 'react';
import api from '../../services/api';
import { ClipboardList, Building2, Users, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface AuditData {
  recentOrganizationChanges: Array<{
    _id: string;
    name: string;
    isActive: boolean;
    subscription: { plan: string };
    updatedAt: string;
    createdAt: string;
  }>;
  recentUserRegistrations: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
    organization: { _id: string; name: string } | null;
  }>;
}

const AuditLog = () => {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'orgs' | 'users'>('orgs');

  useEffect(() => {
    fetchAuditLog();
  }, []);

  const fetchAuditLog = async () => {
    setLoading(true);
    try {
      const { data: auditData } = await api.get('/superadmin/audit-log');
      setData(auditData);
    } catch (error) {
      toast.error('Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-dark-400 mt-1">Recent platform activity</p>
        </div>
        <button
          onClick={fetchAuditLog}
          className="flex items-center gap-2 px-3 py-2 bg-dark-700 rounded-lg text-dark-300 hover:text-white transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 rounded-lg p-1 w-fit border border-dark-700">
        <button
          onClick={() => setTab('orgs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'orgs' ? 'bg-red-500/20 text-red-400' : 'text-dark-400 hover:text-white'
          }`}
        >
          <Building2 size={16} />
          Organizations
        </button>
        <button
          onClick={() => setTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'users' ? 'bg-red-500/20 text-red-400' : 'text-dark-400 hover:text-white'
          }`}
        >
          <Users size={16} />
          User Registrations
        </button>
      </div>

      {/* Content */}
      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
        {tab === 'orgs' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Organization</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Plan</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Created</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrganizationChanges.map(org => (
                  <tr key={org._id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                    <td className="px-4 py-3">
                      <span className="text-sm text-white">{org.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        org.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {org.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-dark-300 capitalize">{org.subscription?.plan || 'free'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-dark-400">{formatDate(org.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-dark-400">{formatDate(org.updatedAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Organization</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-dark-400 uppercase">Registered</th>
                </tr>
              </thead>
              <tbody>
                {data.recentUserRegistrations.map(user => (
                  <tr key={user._id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm text-white">{user.name}</p>
                        <p className="text-xs text-dark-400">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-dark-300">
                        {user.organization ? user.organization.name : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-dark-300 capitalize">{user.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-dark-400">{formatDate(user.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLog;

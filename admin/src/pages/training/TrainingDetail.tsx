import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, GraduationCap, Edit2, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { Training } from '../../types';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Select, { SelectOption } from '../../components/ui/Select';

const TrainingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManage = user?.role && ['hr', 'ceo'].includes(user.role);

  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTraining();
  }, [id]);

  const fetchTraining = async () => {
    try {
      const { data } = await api.get(`/training/${id}`);
      setTraining(data);
    } catch {
      toast.error('Failed to fetch training details');
      navigate('/training');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    if (!training) return;
    setUpdatingId(userId);
    try {
      const { data } = await api.put(`/training/${training._id}/participant-status`, {
        userId,
        status: newStatus,
      });
      setTraining(data);
      toast.success(`Status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!training || !confirm('Remove this participant from training?')) return;
    setUpdatingId(userId);
    try {
      const { data } = await api.post(`/training/${training._id}/remove-participant`, { userId });
      setTraining(data);
      toast.success('Participant removed');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to remove participant');
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!training) {
    return (
      <div className="text-center py-16">
        <p className="text-dark-400">Training not found</p>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    enrolled: { label: 'Enrolled', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    completed: { label: 'Completed', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    dropped: { label: 'Dropped', color: 'text-red-400', bgColor: 'bg-red-500/20' },
    suspended: { label: 'Suspended', color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/training')}
          className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-dark-400 hover:text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white">{training.title}</h1>
          <p className="text-dark-400 text-sm mt-1">
            {training.type.charAt(0).toUpperCase() + training.type.slice(1)} Training
          </p>
        </div>
      </div>

      {/* Training Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Status',
            value: training.status ? training.status.charAt(0).toUpperCase() + training.status.slice(1) : 'N/A',
            bgColor: 'bg-purple-500/10',
            icon: <GraduationCap size={18} className="text-purple-400" />,
          },
          {
            label: 'Participants',
            value: `${training.participants?.length || 0}${training.maxParticipants ? ` / ${training.maxParticipants}` : ''}`,
            bgColor: 'bg-brand-500/10',
            icon: <Users size={18} className="text-brand-400" />,
          },
          {
            label: 'Start Date',
            value: new Date(training.startDate).toLocaleDateString(),
            bgColor: 'bg-emerald-500/10',
            icon: <Calendar size={18} className="text-emerald-400" />,
          },
          {
            label: 'End Date',
            value: new Date(training.endDate).toLocaleDateString(),
            bgColor: 'bg-amber-500/10',
            icon: <Calendar size={18} className="text-amber-400" />,
          },
        ].map((item) => (
          <div key={item.label} className={`${item.bgColor} rounded-xl p-4 border border-dark-700/40`}>
            <p className="text-dark-400 text-xs font-medium mb-2">{item.label}</p>
            <div className="flex items-center gap-2">
              {item.icon}
              <p className="text-white font-semibold">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Training Details */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-dark-300 mb-3">Description</h3>
            <p className="text-white leading-relaxed">{training.description || 'No description provided'}</p>
          </div>
          <div className="space-y-4">
            {training.trainer && (
              <div>
                <p className="text-sm font-semibold text-dark-300 mb-1">Trainer</p>
                <p className="text-white">{training.trainer}</p>
              </div>
            )}
            {training.createdBy && (
              <div>
                <p className="text-sm font-semibold text-dark-300 mb-1">Created By</p>
                <p className="text-white">{(training.createdBy as any).name || 'Unknown'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enrollees Table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-700/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Enrolled Participants</h2>
          <p className="text-xs text-dark-400">{training.participants?.length || 0} total</p>
        </div>

        {training.participants && training.participants.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700/50">
                  <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-3">Name</th>
                  <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-3">Employee ID</th>
                  <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-3">Department</th>
                  <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-3 hidden sm:table-cell">Designation</th>
                  <th className="text-center text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-3">Status</th>
                  {canManage && <th className="text-center text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/30">
                {training.participants.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-dark-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-white font-medium">{p.user?.name || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-300">{p.user?.employeeId || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-dark-300">{p.user?.department?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-dark-300 hidden sm:table-cell">{p.user?.designation?.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          statusConfig[p.status]?.bgColor
                        } ${statusConfig[p.status]?.color}`}
                      >
                        {statusConfig[p.status]?.label || p.status}
                      </span>
                    </td>

                    {canManage && (
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Select
                            value={p.status}
                            onChange={(val) => handleStatusChange(p.user._id, val)}
                            options={[
                              { value: 'enrolled', label: 'Enrolled' },
                              { value: 'completed', label: 'Completed' },
                              { value: 'suspended', label: 'Suspend' },
                              { value: 'dropped', label: 'Dropped' },
                            ]}
                            disabled={updatingId === p.user._id}
                            className="w-32"
                          />
                          <button
                            onClick={() => handleRemoveParticipant(p.user._id)}
                            disabled={updatingId === p.user._id}
                            className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-dark-700 rounded transition-colors disabled:opacity-50"
                            title="Remove participant"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <Users size={32} className="mx-auto mb-3 text-dark-600" />
            <p className="text-dark-400">No participants enrolled yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingDetail;

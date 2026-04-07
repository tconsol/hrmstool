import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { UserCircle, Save, Lock } from 'lucide-react';

const MyProfile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    phone: '',
    address: '',
  });

  // Password change
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.get('/auth/me');
      // For employees, we can only update phone and address through their own profile
      // This is a self-service update
      updateUser({ ...data, phone: form.phone, address: form.address });
      toast.success('Profile updated');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPassword(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-dark-400 text-sm mt-1">View and manage your personal information</p>
      </div>

      {/* Profile Info Card */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 pb-6 border-b border-dark-700/50">
          <div className="w-16 h-16 bg-brand-600/20 rounded-full flex items-center justify-center">
            <UserCircle size={40} className="text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{user.name}</h2>
            <p className="text-sm text-dark-400">{user.employeeId} • {typeof user.designation === 'object' && user.designation ? (user.designation as any).name : (user.designation || user.role)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-dark-500 uppercase">Email</label>
            <p className="text-sm text-white mt-1">{user.email}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-dark-500 uppercase">Department</label>
            <p className="text-sm text-white mt-1">{typeof user.department === 'object' && user.department ? (user.department as any).name : (user.department || 'N/A')}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-dark-500 uppercase">Designation</label>
            <p className="text-sm text-white mt-1">{typeof user.designation === 'object' && user.designation ? (user.designation as any).name : (user.designation || 'N/A')}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-dark-500 uppercase">Joining Date</label>
            <p className="text-sm text-white mt-1">
              {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-dark-500 uppercase">Role</label>
            <p className="text-sm text-white mt-1 capitalize">{user.role}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-dark-500 uppercase">Status</label>
            <p className="mt-1">
              <span className={user.status === 'active' ? 'badge-success' : 'badge-danger'}>
                {user.status}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Edit Info */}
      <form onSubmit={handleUpdateProfile} className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-white">Update Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-dark"
              placeholder="Phone number"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="input-dark min-h-[80px]"
              placeholder="Your address"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Save Changes
          </button>
        </div>
      </form>

      {/* Change Password */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Lock size={20} className="text-dark-400" />
            Change Password
          </h3>
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="btn-secondary text-sm"
          >
            {showPassword ? 'Cancel' : 'Change'}
          </button>
        </div>

        {showPassword && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                className="input-dark"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="input-dark"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="input-dark"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="btn-primary">Update Password</button>
            </div>
          </form>
        )}
      </div>

      {/* Leave Balance */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Leave Balance</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-dark-700/30 rounded-lg">
            <p className="text-2xl font-bold text-emerald-400">{user.leaveBalance?.casual || 0}</p>
            <p className="text-xs text-dark-400 mt-1">Casual</p>
          </div>
          <div className="text-center p-4 bg-dark-700/30 rounded-lg">
            <p className="text-2xl font-bold text-blue-400">{user.leaveBalance?.sick || 0}</p>
            <p className="text-xs text-dark-400 mt-1">Sick</p>
          </div>
          <div className="text-center p-4 bg-dark-700/30 rounded-lg">
            <p className="text-2xl font-bold text-purple-400">{user.leaveBalance?.paid || 0}</p>
            <p className="text-xs text-dark-400 mt-1">Paid</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;

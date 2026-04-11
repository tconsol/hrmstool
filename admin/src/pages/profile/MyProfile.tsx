import { useState, useEffect, useRef, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { UserCircle, Save, Lock, Camera, Eye, FileText, User, CreditCard, ShieldCheck, Phone } from 'lucide-react';
import DatePicker from '../../components/ui/DatePicker';

type Tab = 'personal' | 'bank' | 'documents' | 'security';

const MyProfile = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [loading, setLoading] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const picInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Record<string, any>>({});
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [form, setForm] = useState({
    phone: '',
    address: '',
    email: '',
    fatherName: '',
    dateOfBirth: '',
    bloodGroup: '',
    nomineeName: '',
    nomineeRelationship: '',
    contactName: '',
    contactPhone: '',
    emergencyRelationship: '',
    aadhaarNumber: '',
    panNumber: '',
    bankName: '',
    bankAccountNumber: '',
    ifscCode: '',
    uan: '',
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
        email: user.email || '',
        fatherName: user.fatherName || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        bloodGroup: user.bloodGroup || '',
        nomineeName: user.nomineeName || '',
        nomineeRelationship: user.nomineeRelationship || '',
        contactName: user.emergencyContact?.name || '',
        contactPhone: user.emergencyContact?.phone || '',
        emergencyRelationship: user.emergencyContact?.relationship || '',
        aadhaarNumber: user.aadhaarNumber || '',
        panNumber: user.panNumber || '',
        bankName: user.bankName || '',
        bankAccountNumber: user.bankAccountNumber || '',
        ifscCode: user.ifscCode || '',
        uan: user.uan || '',
      });
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const { data } = await api.get(`/employees/${user?._id}/documents`);
      setDocuments(data.onboardingDocuments || {});
    } catch {
      // silently ignore - user may not have documents
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', {
        phone: form.phone,
        address: form.address,
        email: form.email,
        fatherName: form.fatherName,
        dateOfBirth: form.dateOfBirth,
        bloodGroup: form.bloodGroup,
        nomineeName: form.nomineeName,
        nomineeRelationship: form.nomineeRelationship,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        emergencyRelationship: form.emergencyRelationship,
        aadhaarNumber: form.aadhaarNumber,
        panNumber: form.panNumber,
        bankName: form.bankName,
        bankAccountNumber: form.bankAccountNumber,
        ifscCode: form.ifscCode,
        uan: form.uan,
      });
      updateUser(data);
      toast.success('Profile updated successfully');
      setIsEditMode(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB');
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, or WebP images are allowed');
      return;
    }
    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/employees/profile/picture', formData);
      updateUser({ ...user!, profilePicture: data.profilePicture });
      toast.success('Profile picture updated');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload profile picture');
    } finally {
      setUploadingPic(false);
      if (picInputRef.current) picInputRef.current.value = '';
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

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'personal', label: 'Personal Details', icon: <User size={16} /> },
    { id: 'bank', label: 'Bank Details', icon: <CreditCard size={16} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
    { id: 'security', label: 'Security', icon: <ShieldCheck size={16} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-dark-400 text-sm mt-1">View and manage your personal information</p>
      </div>

      {/* Profile Header Card */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="relative group flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-brand-600/20 flex items-center justify-center border-2 border-brand-600/30">
              {user.profilePicture?.url ? (
                <img src={user.profilePicture.url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={56} className="text-brand-400" />
              )}
            </div>
            <button
              onClick={() => picInputRef.current?.click()}
              disabled={uploadingPic}
              className="absolute inset-0 w-20 h-20 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              {uploadingPic ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera size={18} className="text-white" />
              )}
            </button>
            <input ref={picInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleProfilePicUpload} className="hidden" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-white">{user.name}</h2>
            <p className="text-sm text-dark-400 mt-0.5">
              {user.employeeId} • {typeof user.designation === 'object' && user.designation ? (user.designation as any).name : (user.designation || user.role)}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-sm">
              <span className="text-dark-400">
                <span className="text-dark-500 uppercase text-xs font-medium mr-1">Dept:</span>
                {typeof user.department === 'object' && user.department ? (user.department as any).name : 'N/A'}
              </span>
              <span className="text-dark-400">
                <span className="text-dark-500 uppercase text-xs font-medium mr-1">Role:</span>
                <span className="capitalize">{user.role}</span>
              </span>
              <span className="text-dark-400">
                <span className="text-dark-500 uppercase text-xs font-medium mr-1">Joined:</span>
                {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}
              </span>
              <span>
                <span className={user.status === 'active' ? 'badge-success' : 'badge-danger'}>{user.status}</span>
              </span>
            </div>
          </div>

          {/* Leave Balance */}
          <div className="flex gap-3 flex-shrink-0">
            {[{ label: 'Casual', value: user.leaveBalance?.casual || 0, color: 'text-emerald-400' },
              { label: 'Sick', value: user.leaveBalance?.sick || 0, color: 'text-blue-400' },
              { label: 'Paid', value: user.leaveBalance?.paid || 0, color: 'text-purple-400' }].map(({ label, value, color }) => (
              <div key={label} className="leave-balance-box text-center px-3 py-2 rounded-lg">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="leave-balance-label text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b border-dark-700/60 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                  : 'border-transparent text-dark-400 hover:text-dark-200 hover:bg-dark-700/30'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">

          {/* ── Personal Details Tab ── */}
          {activeTab === 'personal' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Contact Info */}
              <div>
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <Phone size={16} className="text-brand-400" /> Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Email</label>
                    <input disabled={!isEditMode} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-dark disabled:opacity-50 disabled:cursor-not-allowed" type="email" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Phone</label>
                    <input disabled={!isEditMode} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-dark disabled:opacity-50 disabled:cursor-not-allowed" placeholder="Phone number" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Address</label>
                    <textarea disabled={!isEditMode} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-dark disabled:opacity-50 disabled:cursor-not-allowed min-h-[80px]" placeholder="Your address" />
                  </div>
                </div>
              </div>

              <div className="border-t border-dark-700/50 pt-6">
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <User size={16} className="text-brand-400" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Father's Name</label>
                    <input disabled={!isEditMode} value={form.fatherName} onChange={(e) => setForm({ ...form, fatherName: e.target.value })} className="input-dark disabled:opacity-50 disabled:cursor-not-allowed" placeholder="Father's name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Date of Birth</label>
                    <DatePicker disabled={!isEditMode} value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Blood Group</label>
                    <input disabled={!isEditMode} value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} className="input-dark disabled:opacity-50 disabled:cursor-not-allowed" placeholder="e.g., O+" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Aadhaar Number</label>
                    <input disabled={!isEditMode} value={form.aadhaarNumber} onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value })} className="input-dark disabled:opacity-50 disabled:cursor-not-allowed" placeholder="XXXX XXXX XXXX" maxLength={14} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">PAN Number</label>
                    <input disabled={!isEditMode} value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })} className="input-dark disabled:opacity-50 disabled:cursor-not-allowed" placeholder="e.g., ABCDE1234F" maxLength={10} />
                  </div>
                </div>
              </div>

              <div className="border-t border-dark-700/50 pt-6">
                <h3 className="text-base font-semibold text-white mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Contact Name</label>
                    <input disabled={!isEditMode} value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="input-dark disabled:opacity-50 disabled:cursor-not-allowed" placeholder="Name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Contact Phone</label>
                    <input disabled={!isEditMode} value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="input-dark disabled:opacity-50 disabled:cursor-not-allowed" placeholder="Phone" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Relationship</label>
                    <input disabled={!isEditMode} value={form.emergencyRelationship} onChange={(e) => setForm({ ...form, emergencyRelationship: e.target.value })} className="input-dark disabled:opacity-50 disabled:cursor-not-allowed" placeholder="e.g., Spouse, Parent" />
                  </div>
                </div>
              </div>

              <div className="border-t border-dark-700/50 pt-6">
                <h3 className="text-base font-semibold text-white mb-4">Nominee Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Nominee Name</label>
                    <input disabled={!isEditMode} value={form.nomineeName} onChange={(e) => setForm({ ...form, nomineeName: e.target.value })} className="input-dark disabled:opacity-50 disabled:cursor-not-allowed" placeholder="Nominee name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Nominee Relationship</label>
                    <input disabled={!isEditMode} value={form.nomineeRelationship} onChange={(e) => setForm({ ...form, nomineeRelationship: e.target.value })} className="input-dark disabled:opacity-50 disabled:cursor-not-allowed" placeholder="e.g., Spouse, Child" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {!isEditMode ? (
                  <button
                    type="button"
                    onClick={() => setIsEditMode(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    Edit Details
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="px-5 py-2 text-sm font-medium text-gray-300 border border-dark-600 rounded-lg hover:bg-dark-700/50 transition-all"
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                      {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </form>
          )}

          {/* ── Bank Details Tab ── */}
          {activeTab === 'bank' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                  <CreditCard size={16} className="text-brand-400" /> Bank & Statutory Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Bank Name</label>
                    <input disabled={!isEditMode} value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} className="input-dark disabled:opacity-50 disabled:cursor-not-allowed" placeholder="e.g., HDFC Bank" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Account Number</label>
                    <input disabled={!isEditMode} value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} className="input-dark disabled:opacity-50 disabled:cursor-not-allowed" placeholder="Account number" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">IFSC Code</label>
                    <input disabled={!isEditMode} value={form.ifscCode} onChange={(e) => setForm({ ...form, ifscCode: e.target.value.toUpperCase() })} className="input-dark disabled:opacity-50 disabled:cursor-not-allowed" placeholder="e.g., HDFC0001234" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">UAN Number</label>
                    <input disabled={!isEditMode} value={form.uan} onChange={(e) => setForm({ ...form, uan: e.target.value })} className="input-dark disabled:opacity-50 disabled:cursor-not-allowed" placeholder="UAN number" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                {!isEditMode ? (
                  <button
                    type="button"
                    onClick={() => setIsEditMode(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    Edit Details
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditMode(false)}
                      className="px-5 py-2 text-sm font-medium text-gray-300 border border-dark-600 rounded-lg hover:bg-dark-700/50 transition-all"
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                      {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </form>
          )}

          {/* ── Documents Tab ── */}
          {activeTab === 'documents' && (
            <div>
              <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <FileText size={16} className="text-brand-400" /> My Documents
              </h3>
              {loadingDocs ? (
                <div className="flex items-center justify-center h-32">
                  <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : Object.values(documents).some((d: any) => d?.gcsPath) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(documents).map(([key, value]: any) =>
                    value?.gcsPath ? (
                      <a
                        key={key}
                        href={value.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 bg-dark-700/30 hover:bg-dark-700/50 rounded-lg border border-dark-700/50 hover:border-brand-500/50 transition-all group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white group-hover:text-brand-400 transition-colors capitalize truncate">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </p>
                            <p className="text-xs text-dark-500 mt-0.5">Click to view</p>
                          </div>
                          <Eye size={15} className="text-dark-400 group-hover:text-brand-400 transition-colors flex-shrink-0" />
                        </div>
                      </a>
                    ) : null
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText size={40} className="text-dark-600 mx-auto mb-3" />
                  <p className="text-dark-400 text-sm">No documents uploaded yet</p>
                  <p className="text-dark-600 text-xs mt-1">Documents uploaded by HR will appear here</p>
                </div>
              )}
            </div>
          )}

          {/* ── Security Tab ── */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
                  <Lock size={16} className="text-brand-400" /> Change Password
                </h3>
                <p className="text-dark-500 text-sm mb-5">Update your account password. We recommend using a strong password.</p>
                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
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
                    <label className="block text-sm font-medium text-dark-300 mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="input-dark"
                      required
                    />
                  </div>
                  <div className="flex justify-start pt-1">
                    <button type="submit" className="btn-primary">Update Password</button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default MyProfile;

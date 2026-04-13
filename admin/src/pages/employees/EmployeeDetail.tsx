import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, Phone, Briefcase, Users, Calendar, FileText, Heart, User, Lock, Copy, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface EmployeeDetail {
  _id: string;
  name: string;
  employeeId: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  department: any;
  designation: any;
  salary: number;
  joiningDate: string;
  address: string;
  fatherName: string;
  fatherDateOfBirth: string;
  motherName: string;
  motherDateOfBirth: string;
  parentAddress: string;
  dateOfBirth: string;
  bloodGroup: string;
  healthIssues: string;
  nomineeName: string;
  nomineeRelationship: string;
  nomineephone?: string;
  aadhaarNumber: string;
  panNumber: string;
  bankAccountNumber: string;
  accountType: string;
  branchAddress: string;
  ifscCode: string;
  bankName: string;
  uan: string;
  profilePicture?: {
    gcsPath?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    url?: string;
    uploadedAt?: string;
  };
  ctc?: {
    annualCTC: number;
    basic: number;
    hra: number;
  };
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Check if user is HR, CEO, or Manager
  const canViewSensitiveData = ['hr', 'ceo', 'manager'].includes(user?.role ?? '');

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      const { data } = await api.get(`/employees/${id}`);
      setEmployee(data);
    } catch (error) {
      toast.error('Failed to fetch employee details');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/employees')}
          className="p-2 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-4 flex-1">
          {employee.profilePicture?.url ? (
            <img
              src={employee.profilePicture.url}
              alt={employee.name}
              className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border-2 border-brand-500/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-brand-600/20 flex items-center justify-center text-2xl font-bold text-brand-400 flex-shrink-0 border-2 border-brand-500/30">
              {employee.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-white">{employee.name}</h1>
            <p className="text-dark-400 text-sm mt-1">{employee.employeeId}</p>
          </div>
        </div>
        <span className={employee.status === 'active' ? 'badge-success' : 'badge-danger'}>
          {employee.status?.charAt(0).toUpperCase() + employee.status?.slice(1)}
        </span>
      </div>

      {/* Work Information Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Mail size={20} className="text-blue-400" />
            Contact Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Email</p>
              <p className="text-white font-medium">{employee.email}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Phone</p>
              <p className="text-white font-medium">{employee.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Address</p>
              <p className="text-white font-medium text-sm">{employee.address || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Job Information */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Briefcase size={20} className="text-cyan-400" />
            Job Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Role</p>
              <p className="text-white font-medium capitalize">{employee.role}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Department</p>
              <p className="text-white font-medium">
                {typeof employee.department === 'object' ? employee.department?.name : employee.department || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Designation</p>
              <p className="text-white font-medium">
                {typeof employee.designation === 'object' ? employee.designation?.name : employee.designation || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Salary & CTC */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users size={20} className="text-green-400" />
            Salary Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Monthly Salary</p>
              <p className="text-white font-medium">₹{employee.salary?.toLocaleString() || 'N/A'}</p>
            </div>
            {employee.ctc?.annualCTC && (
              <>
                <div>
                  <p className="text-xs text-dark-400 uppercase tracking-wide">Annual CTC</p>
                  <p className="text-white font-medium">₹{employee.ctc.annualCTC?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-dark-400 uppercase tracking-wide">Basic Salary</p>
                  <p className="text-white font-medium">₹{employee.ctc.basic?.toLocaleString() || 'N/A'}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User size={20} className="text-purple-400" />
            Personal Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Date of Birth</p>
              <p className="text-white font-medium">{employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Father's Name</p>
              <p className="text-white font-medium">{employee.fatherName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Blood Group</p>
              <p className="text-white font-medium">{employee.bloodGroup || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Heart size={20} className="text-red-400" />
            Emergency Contact
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Nominee Name</p>
              <p className="text-white font-medium">{employee.nomineeName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Relationship</p>
              <p className="text-white font-medium">{employee.nomineeRelationship || 'N/A'}</p>
            </div>
            {employee.nomineephone && (
              <div>
                <p className="text-xs text-dark-400 uppercase tracking-wide">Contact Phone</p>
                <p className="text-white font-medium">{employee.nomineephone}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Family & Health Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Family Information */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User size={20} className="text-cyan-400" />
            Family Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Father's Name</p>
              <p className="text-white font-medium">{employee.fatherName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Father's DOB</p>
              <p className="text-white font-medium">{employee.fatherDateOfBirth ? new Date(employee.fatherDateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Mother's Name</p>
              <p className="text-white font-medium">{employee.motherName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Mother's DOB</p>
              <p className="text-white font-medium">{employee.motherDateOfBirth ? new Date(employee.motherDateOfBirth).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Parent's Address</p>
              <p className="text-white font-medium text-sm">{employee.parentAddress || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Health Information */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Heart size={20} className="text-pink-400" />
            Health Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide">Known Health Issues</p>
              <p className="text-white font-medium">{employee.healthIssues || 'None reported'}</p>
            </div>
            <div className="pt-2">
              <p className="text-xs text-dark-300 italic">Please inform HR immediately of any changes to health status.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sensitive Information - Only for HR/Managers */}
      {canViewSensitiveData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Government IDs */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-yellow-400" />
              Government IDs
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-dark-400 uppercase tracking-wide">Aadhaar Number</p>
                <p className="text-white font-mono text-sm">{employee.aadhaarNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-dark-400 uppercase tracking-wide">PAN Number</p>
                <p className="text-white font-mono text-sm">{employee.panNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-dark-400 uppercase tracking-wide">UAN</p>
                <p className="text-white font-mono text-sm">{employee.uan || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-emerald-400" />
              Bank Details
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-dark-400 uppercase tracking-wide">Bank Name</p>
                <p className="text-white font-medium">{employee.bankName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-dark-400 uppercase tracking-wide">Account Type</p>
                <p className="text-white font-medium capitalize">{employee.accountType || 'N/A'}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-dark-400 uppercase tracking-wide mb-1">Account Number</p>
                  <p className="text-white font-mono text-sm">{employee.bankAccountNumber || 'N/A'}</p>
                </div>
                {employee.bankAccountNumber && (
                  <button
                    onClick={() => handleCopyToClipboard(employee.bankAccountNumber, 'Account Number')}
                    className={`ml-3 p-2 rounded-lg transition-all ${
                      copiedField === 'Account Number'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'hover:bg-dark-700/50 text-dark-400 hover:text-emerald-400'
                    }`}
                    title="Copy Account Number"
                  >
                    {copiedField === 'Account Number' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs text-dark-400 uppercase tracking-wide mb-1">IFSC Code</p>
                  <p className="text-white font-mono text-sm">{employee.ifscCode || 'N/A'}</p>
                </div>
                {employee.ifscCode && (
                  <button
                    onClick={() => handleCopyToClipboard(employee.ifscCode, 'IFSC Code')}
                    className={`ml-3 p-2 rounded-lg transition-all ${
                      copiedField === 'IFSC Code'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'hover:bg-dark-700/50 text-dark-400 hover:text-emerald-400'
                    }`}
                    title="Copy IFSC Code"
                  >
                    {copiedField === 'IFSC Code' ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                )}
              </div>
              <div>
                <p className="text-xs text-dark-400 uppercase tracking-wide">Branch Address</p>
                <p className="text-white font-medium text-sm">{employee.branchAddress || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-center gap-3 text-yellow-400">
            <Lock size={20} />
            <p className="text-sm font-medium">Sensitive information is only visible to HR, Management, and authorized personnel.</p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 flex-wrap">
        {canViewSensitiveData && (
          <button
            onClick={() => navigate(`/employees/edit/${employee._id}`)}
            className="btn-primary"
          >
            Edit Employee
          </button>
        )}
        <button
          onClick={() => navigate(`/employees/${employee._id}/documents`)}
          className="btn-secondary"
        >
          View Documents
        </button>
      </div>
    </div>
  );
}

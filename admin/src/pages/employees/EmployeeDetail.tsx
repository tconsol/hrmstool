import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, Phone, Briefcase, Users, Calendar, FileText, Heart, User } from 'lucide-react';

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
  dateOfBirth: string;
  bloodGroup: string;
  nomineeName: string;
  nomineeRelationship: string;
  aadhaarNumber: string;
  panNumber: string;
  bankAccountNumber: string;
  ifscCode: string;
  bankName: string;
  uan: string;
  ctc?: {
    annualCTC: number;
    basic: number;
    hra: number;
  };
}

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/employees')}
          className="p-2 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">{employee.name}</h1>
          <p className="text-dark-400 text-sm mt-1">{employee.employeeId}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span className={employee.status === 'active' ? 'badge-success' : 'badge-danger'}>
          {employee.status?.charAt(0).toUpperCase() + employee.status?.slice(1)}
        </span>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Mail size={20} className="text-brand-400" />
            Contact Information
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-dark-400">Email</p>
              <p className="text-white">{employee.email}</p>
            </div>
            <div>
              <p className="text-sm text-dark-400">Phone</p>
              <p className="text-white">{employee.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-dark-400">Address</p>
              <p className="text-white">{employee.address || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Job Information */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Briefcase size={20} className="text-brand-400" />
            Job Information
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-dark-400">Role</p>
              <p className="text-white capitalize">{employee.role}</p>
            </div>
            <div>
              <p className="text-sm text-dark-400">Department</p>
              <p className="text-white">
                {typeof employee.department === 'object' ? employee.department?.name : employee.department || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-dark-400">Designation</p>
              <p className="text-white">
                {typeof employee.designation === 'object' ? employee.designation?.name : employee.designation || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Salary Information */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users size={20} className="text-brand-400" />
            Salary Information
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-dark-400">Monthly Salary</p>
              <p className="text-white">₹{employee.salary?.toLocaleString() || 'N/A'}</p>
            </div>
            {employee.ctc?.annualCTC && (
              <>
                <div>
                  <p className="text-sm text-dark-400">Annual CTC</p>
                  <p className="text-white">₹{employee.ctc.annualCTC?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-dark-400">Basic Salary</p>
                  <p className="text-white">₹{employee.ctc.basic?.toLocaleString() || 'N/A'}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Personal Information */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <User size={20} className="text-brand-400" />
            Personal Information
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-dark-400">Date of Birth</p>
              <p className="text-white">{employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-dark-400">Father's Name</p>
              <p className="text-white">{employee.fatherName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-dark-400">Blood Group</p>
              <p className="text-white">{employee.bloodGroup || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Emergency & Documents */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Heart size={20} className="text-brand-400" />
            Emergency Contact
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-dark-400">Nominee Name</p>
              <p className="text-white">{employee.nomineeName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-dark-400">Nominee Relationship</p>
              <p className="text-white">{employee.nomineeRelationship || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Government IDs */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText size={20} className="text-brand-400" />
            Government IDs
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-dark-400">Aadhaar Number</p>
              <p className="text-white font-mono">{employee.aadhaarNumber ? employee.aadhaarNumber.replace(/\d(?=\d{4})/g, '*') : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-dark-400">PAN Number</p>
              <p className="text-white font-mono">{employee.panNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-dark-400">UAN</p>
              <p className="text-white font-mono">{employee.uan || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-brand-400" />
            Bank Details
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-dark-400">Bank Name</p>
              <p className="text-white">{employee.bankName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-dark-400">Account Number</p>
              <p className="text-white font-mono">{employee.bankAccountNumber ? employee.bankAccountNumber.slice(-4).padStart(employee.bankAccountNumber.length, '*') : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-dark-400">IFSC Code</p>
              <p className="text-white font-mono">{employee.ifscCode || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={() => navigate(`/employees/edit/${employee._id}`)}
          className="btn-primary"
        >
          Edit Employee
        </button>
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

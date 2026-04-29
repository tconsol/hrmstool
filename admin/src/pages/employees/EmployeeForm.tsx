import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, ChevronDown, ChevronUp, Calculator, FileText, Eye, EyeOff } from 'lucide-react';
import Select from '../../components/ui/Select';
import DatePicker from '../../components/ui/DatePicker';

const defaultCTC = {
  annualCTC: 0, basic: 0, hra: 0, specialAllowance: 0,
  conveyanceAllowance: 0, medicalAllowance: 0, lta: 0,
  epfEmployer: 0, gratuity: 0, insurance: 0, variablePay: 0,
  foodCoupons: 0, transportAllowance: 0, internetReimbursement: 0,
};

const calculateCTC = (annualCTC: number) => {
  const basic = Math.round(annualCTC * 0.4);
  const hra = Math.round(basic * 0.5);
  const epfEmployer = Math.round(Math.min(basic, 180000) * 0.12);
  const gratuity = Math.round(basic * 0.0481);
  const specialAllowance = Math.max(0, annualCTC - basic - hra - epfEmployer - gratuity);
  return { ...defaultCTC, annualCTC, basic, hra, specialAllowance, epfEmployer, gratuity };
};

const EmployeeForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [ctcMode, setCtcMode] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [ctc, setCtc] = useState(defaultCTC);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

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
    dateOfBirth: '',
    bloodGroup: '',
    fatherName: '',
    fatherDateOfBirth: '',
    motherName: '',
    motherDateOfBirth: '',
    parentAddress: '',
    bankAccountNumber: '',
    accountType: 'savings',
    branchAddress: '',
    ifscCode: '',
    bankName: '',
    healthIssues: '',
  });

  useEffect(() => {
    fetchDepartmentsAndDesignations();
    if (isEdit) {
      fetchEmployee();
    } else {
      setFetching(false);
    }
  }, [id]);

  const fetchDepartmentsAndDesignations = async () => {
    try {
      const [deptsRes, desRes] = await Promise.all([
        api.get('/employees/departments'),
        api.get('/employees/designations'),
      ]);
      setDepartments(Array.isArray(deptsRes.data) ? deptsRes.data : []);
      setDesignations(Array.isArray(desRes.data) ? desRes.data : []);
    } catch (error) {      toast.error('Failed to load departments and designations');
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchEmployee = async () => {
    try {
      const { data } = await api.get(`/employees/${id}`);
      const departmentId = typeof data.department === 'object' ? data.department?._id : data.department;
      const designationId = typeof data.designation === 'object' ? data.designation?._id : data.designation;
      
      setForm({
        name: data.name || '',
        email: data.email || '',
        password: '',
        phone: data.phone || '',
        role: data.role || 'employee',
        department: departmentId || '',
        designation: designationId || '',
        salary: data.salary?.toString() || '',
        joiningDate: data.joiningDate?.split('T')[0] || '',
        address: data.address || '',
        dateOfBirth: data.dateOfBirth?.split('T')[0] || '',
        bloodGroup: data.bloodGroup || '',
        fatherName: data.fatherName || '',
        fatherDateOfBirth: data.fatherDateOfBirth?.split('T')[0] || '',
        motherName: data.motherName || '',
        motherDateOfBirth: data.motherDateOfBirth?.split('T')[0] || '',
        parentAddress: data.parentAddress || '',
        bankAccountNumber: data.bankAccountNumber || '',
        accountType: data.accountType || 'savings',
        branchAddress: data.branchAddress || '',
        ifscCode: data.ifscCode || '',
        bankName: data.bankName || '',
        healthIssues: data.healthIssues || '',
      });
      if (data.ctc && data.ctc.annualCTC > 0) {
        setCtcMode(true);
        setCtc(data.ctc);
      }
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

  const handleCTCChange = (annual: number) => {
    const calc = calculateCTC(annual);
    setCtc(calc);
    const gross = Math.round((calc.basic + calc.hra + calc.specialAllowance + calc.conveyanceAllowance + calc.medicalAllowance + calc.lta) / 12);
    setForm(f => ({ ...f, salary: String(gross) }));
  };

  const handleCtcFieldChange = (field: string, value: number) => {
    setCtc(prev => {
      const updated = { ...prev, [field]: value };
      if (field !== 'annualCTC') {
        const gross = Math.round((updated.basic + updated.hra + updated.specialAllowance + updated.conveyanceAllowance + updated.medicalAllowance + updated.lta) / 12);
        setForm(f => ({ ...f, salary: String(gross) }));
      }
      return updated;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = { ...form, salary: Number(form.salary) || 0 };
      if (ctcMode) {
        payload.ctc = ctc;
      }
      if (isEdit) {
        const { password, ...updateData } = payload;
        await api.put(`/employees/${id}`, updateData);
        toast.success('Employee updated successfully');
        navigate('/employees');
      } else {
        if (!payload.password) {
          toast.error('Password is required');
          setLoading(false);
          return;
        }
        const { data } = await api.post('/employees', payload);
        toast.success('Employee added! Redirecting to upload documents...');
        // Navigate to documents page for the newly created employee
        navigate(`/employees/${data._id}/documents`);
      }
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
            {isEdit ? 'Update employee information' : 'Add a new team member (you can upload documents after creating)'}
          </p>
        </div>
      </div>

      {!isEdit && (
        <div className="glass-card p-4 border-l-4 border-brand-500 bg-brand-600/5">
          <div className="flex gap-3 items-start">
            <FileText size={20} className="text-brand-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">Document Upload</h3>
              <p className="text-sm text-dark-300">
                After creating the employee, you'll be taken to the document upload page where you can add onboarding documents (Aadhaar, PAN, educational certificates, etc.)
              </p>
            </div>
          </div>
        </div>
      )}

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
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  className="input-dark pr-10"
                  placeholder="Min 6 characters"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-200 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
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
            <Select
              value={form.role}
              onChange={(v) => setForm({ ...form, role: v })}
              options={[
                { value: 'employee', label: 'Employee' },
                { value: 'hr', label: 'HR / Admin' },
                { value: 'manager', label: 'Manager' },
                { value: 'ceo', label: 'CEO / Founder' },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Department</label>
            <Select
              value={form.department}
              onChange={(v) => setForm({ ...form, department: v })}
              options={departments.map(d => ({ value: d._id, label: d.name }))}
              placeholder="Select Department"
              disabled={loadingOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Designation</label>
            <Select
              value={form.designation}
              onChange={(v) => setForm({ ...form, designation: v })}
              options={designations.map(d => ({ value: d._id, label: d.name }))}
              placeholder="Select Designation"
              disabled={loadingOptions}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Joining Date</label>
            <DatePicker
              value={form.joiningDate}
              onChange={(val) => setForm({ ...form, joiningDate: val })}
            />
          </div>
        </div>

        {/* CTC Salary Structure Section */}
        <div className="border border-dark-700/50 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calculator size={16} className="text-brand-400" />
              Compensation
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs text-dark-400">CTC Breakdown</span>
              <div className={`relative w-10 h-5 rounded-full transition-colors ${ctcMode ? 'bg-brand-600' : 'bg-dark-600'}`}
                onClick={() => {
                  const next = !ctcMode;
                  setCtcMode(next);
                  if (!next) setCtc(defaultCTC);
                }}>
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${ctcMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </label>
          </div>

          {!ctcMode ? (
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Monthly Salary (Rs.)</label>
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
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-300 mb-1.5">Annual CTC (Rs.) *</label>
                <input
                  type="number"
                  value={ctc.annualCTC || ''}
                  onChange={(e) => handleCTCChange(Number(e.target.value) || 0)}
                  className="input-dark border-brand-600/30 focus:border-brand-500"
                  placeholder="e.g. 1000000 for 10 LPA"
                  min="0"
                />
                {ctc.annualCTC > 0 && (
                  <p className="text-xs text-dark-400 mt-1">
                    {(ctc.annualCTC / 100000).toFixed(1)} LPA &bull; Monthly Gross: Rs. {form.salary ? Number(form.salary).toLocaleString('en-IN') : '0'}
                  </p>
                )}
              </div>

              {ctc.annualCTC > 0 && (
                <>
                  {/* Fixed Components */}
                  <div>
                    <p className="text-xs font-semibold text-emerald-400 mb-2 uppercase tracking-wide">Fixed Salary Components</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {([
                        ['basic', 'Basic Salary (40%)'],
                        ['hra', 'HRA (50% of Basic)'],
                        ['specialAllowance', 'Special Allowance'],
                      ] as const).map(([key, label]) => (
                        <div key={key}>
                          <label className="block text-xs text-dark-400 mb-1">{label}</label>
                          <input
                            type="number"
                            value={ctc[key] || ''}
                            onChange={(e) => handleCtcFieldChange(key, Number(e.target.value) || 0)}
                            className="input-dark text-sm"
                            min="0"
                          />
                          <p className="text-[10px] text-dark-500 mt-0.5">Rs. {Math.round((ctc[key] || 0) / 12).toLocaleString('en-IN')}/mo</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Employer Contributions */}
                  <div>
                    <p className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wide">Employer Contributions (Not in-hand)</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {([
                        ['epfEmployer', 'PF (12% of Basic)'],
                        ['gratuity', 'Gratuity (4.81%)'],
                        ['insurance', 'Insurance Premium'],
                      ] as const).map(([key, label]) => (
                        <div key={key}>
                          <label className="block text-xs text-dark-400 mb-1">{label}</label>
                          <input
                            type="number"
                            value={ctc[key] || ''}
                            onChange={(e) => handleCtcFieldChange(key, Number(e.target.value) || 0)}
                            className="input-dark text-sm"
                            min="0"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optional Benefits Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowOptional(!showOptional)}
                    className="flex items-center gap-1 text-xs text-dark-400 hover:text-brand-400 transition-colors"
                  >
                    {showOptional ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    Optional Benefits & Perks
                  </button>

                  {showOptional && (
                    <div>
                      <p className="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wide">Optional Benefits</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {([
                          ['conveyanceAllowance', 'Conveyance'],
                          ['medicalAllowance', 'Medical'],
                          ['lta', 'LTA'],
                          ['variablePay', 'Variable Pay'],
                          ['foodCoupons', 'Food Coupons'],
                          ['transportAllowance', 'Transport'],
                          ['internetReimbursement', 'Internet'],
                        ] as const).map(([key, label]) => (
                          <div key={key}>
                            <label className="block text-xs text-dark-400 mb-1">{label}</label>
                            <input
                              type="number"
                              value={ctc[key] || ''}
                              onChange={(e) => handleCtcFieldChange(key, Number(e.target.value) || 0)}
                              className="input-dark text-sm"
                              min="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Auto-calculated Monthly Gross */}
                  <div className="bg-dark-700/30 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-dark-300">Monthly Gross Salary</span>
                    <span className="text-lg font-bold text-brand-400">Rs. {Number(form.salary || 0).toLocaleString('en-IN')}</span>
                  </div>
                </>
              )}
            </div>
          )}
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

        {/* Personal Information Section */}
        <div className="border-t border-dark-700/50 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Blood Group</label>
              <select
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={handleChange}
                className="input-dark"
              >
                <option value="">Select Blood Group</option>
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>O+</option>
                <option>O-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Health Issues</label>
              <input
                type="text"
                name="healthIssues"
                value={form.healthIssues}
                onChange={handleChange}
                className="input-dark"
                placeholder="e.g., Diabetes, Asthma (if any)"
              />
            </div>
          </div>
        </div>

        {/* Father & Mother Information Section */}
        <div className="border-t border-dark-700/50 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Father & Mother Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Father's Name</label>
              <input
                type="text"
                name="fatherName"
                value={form.fatherName}
                onChange={handleChange}
                className="input-dark"
                placeholder="Father's full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Father's Date of Birth</label>
              <input
                type="date"
                name="fatherDateOfBirth"
                value={form.fatherDateOfBirth}
                onChange={handleChange}
                className="input-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Mother's Name</label>
              <input
                type="text"
                name="motherName"
                value={form.motherName}
                onChange={handleChange}
                className="input-dark"
                placeholder="Mother's full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Mother's Date of Birth</label>
              <input
                type="date"
                name="motherDateOfBirth"
                value={form.motherDateOfBirth}
                onChange={handleChange}
                className="input-dark"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Address</label>
            <textarea
              name="parentAddress"
              value={form.parentAddress}
              onChange={(e) => setForm({ ...form, parentAddress: e.target.value })}
              className="input-dark min-h-[70px] resize-y"
              placeholder="Father and Mother's address"
              rows={2}
            />
          </div>
        </div>

        {/* Bank Information Section */}
        <div className="border-t border-dark-700/50 pt-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Bank Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Bank Name</label>
              <input
                type="text"
                name="bankName"
                value={form.bankName}
                onChange={handleChange}
                className="input-dark"
                placeholder="e.g., HDFC Bank"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Account Type</label>
              <Select
                value={form.accountType}
                onChange={(v) => setForm({ ...form, accountType: v })}
                options={[
                  { value: 'salary', label: 'Salary' },
                  { value: 'savings', label: 'Savings' },
                  { value: 'current', label: 'Current' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Account Number</label>
              <input
                type="text"
                name="bankAccountNumber"
                value={form.bankAccountNumber}
                onChange={handleChange}
                className="input-dark"
                placeholder="Bank account number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">IFSC Code</label>
              <input
                type="text"
                name="ifscCode"
                value={form.ifscCode}
                onChange={handleChange}
                className="input-dark"
                placeholder="e.g., HDFC0001234"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-dark-300 mb-1.5">Branch Address</label>
            <textarea
              name="branchAddress"
              value={form.branchAddress}
              onChange={(e) => setForm({ ...form, branchAddress: e.target.value })}
              className="input-dark min-h-[70px] resize-y"
              placeholder="Bank branch address"
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-between items-center gap-3 pt-4 border-t border-dark-700/50">
          <div>
            {isEdit && (
              <button
                type="button"
                onClick={() => navigate(`/employees/${id}/documents`)}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <FileText size={16} /> Upload Documents
              </button>
            )}
          </div>
          <div className="flex gap-3">
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
        </div>
      </form>
    </div>
  );
};

export default EmployeeForm;

import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, ChevronDown, ChevronUp, Calculator } from 'lucide-react';
import Select from '../../components/ui/Select';

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
        api.get('/departments'),
        api.get('/designations'),
      ]);
      setDepartments(deptsRes.data);
      setDesignations(desRes.data);
    } catch (error) {
      toast.error('Failed to load departments and designations');
    } finally {
      setLoadingOptions(false);
    }
  };

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
            <input
              name="joiningDate"
              type="date"
              value={form.joiningDate}
              onChange={handleChange}
              className="input-dark"
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

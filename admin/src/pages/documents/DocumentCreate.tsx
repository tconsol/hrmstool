import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Download, Printer, Save, Upload, FileText,
  Briefcase, Award, UserCheck, BadgeDollarSign, FileCheck2, Eye, FileType,
} from 'lucide-react';
import Select from '../../components/ui/Select';

// ─── TYPES / CONFIG ────────────────────────────────────────────

const DOC_TYPES: Record<string, { label: string; icon: any; category: string }> = {
  offer_letter: { label: 'Offer Letter', icon: FileText, category: 'Pre-Joining' },
  appointment_letter: { label: 'Appointment Letter', icon: Briefcase, category: 'Pre-Joining' },
  experience_letter: { label: 'Experience Letter', icon: Award, category: 'Exit' },
  relieving_letter: { label: 'Relieving Letter', icon: UserCheck, category: 'Exit' },
  increment_letter: { label: 'Increment Letter', icon: BadgeDollarSign, category: 'During Employment' },
  salary_structure: { label: 'Salary Structure', icon: FileCheck2, category: 'Joining' },
};

const TEMPLATE_FIELDS: Record<string, { key: string; label: string; type: string; placeholder?: string }[]> = {
  offer_letter: [
    { key: 'issueDate', label: 'Issue Date', type: 'date' },
    { key: 'joiningDate', label: 'Joining Date', type: 'date' },
    { key: 'designation', label: 'Designation', type: 'text', placeholder: 'Software Engineer' },
    { key: 'department', label: 'Department', type: 'text', placeholder: 'Engineering' },
    { key: 'annualCTC', label: 'Annual CTC (Rs.)', type: 'number', placeholder: '1000000' },
    { key: 'probationPeriod', label: 'Probation (months)', type: 'number', placeholder: '6' },
    { key: 'noticePeriod', label: 'Notice Period (months)', type: 'number', placeholder: '1' },
    { key: 'workLocation', label: 'Work Location', type: 'text', placeholder: 'Hyderabad' },
    { key: 'reportingManager', label: 'Reporting Manager', type: 'text' },
    { key: 'hrName', label: 'HR Signatory Name', type: 'text' },
    { key: 'hrDesignation', label: 'HR Signatory Designation', type: 'text', placeholder: 'HR Manager' },
  ],
  appointment_letter: [
    { key: 'issueDate', label: 'Issue Date', type: 'date' },
    { key: 'joiningDate', label: 'Joining Date', type: 'date' },
    { key: 'designation', label: 'Designation', type: 'text' },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'annualCTC', label: 'Annual CTC (Rs.)', type: 'number' },
    { key: 'probationPeriod', label: 'Probation (months)', type: 'number', placeholder: '6' },
    { key: 'noticePeriod', label: 'Notice Period (months)', type: 'number', placeholder: '1' },
    { key: 'workLocation', label: 'Work Location', type: 'text' },
    { key: 'workingHours', label: 'Working Hours', type: 'text', placeholder: '9:00 AM to 6:00 PM, Mon-Fri' },
    { key: 'hrName', label: 'HR Signatory Name', type: 'text' },
    { key: 'hrDesignation', label: 'HR Signatory Designation', type: 'text' },
  ],
  experience_letter: [
    { key: 'issueDate', label: 'Issue Date', type: 'date' },
    { key: 'joiningDate', label: 'Date of Joining', type: 'date' },
    { key: 'lastWorkingDate', label: 'Last Working Date', type: 'date' },
    { key: 'designation', label: 'Designation', type: 'text' },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'performanceNote', label: 'Performance Note', type: 'textarea', placeholder: 'Their conduct and performance have been satisfactory...' },
    { key: 'hrName', label: 'HR Signatory Name', type: 'text' },
    { key: 'hrDesignation', label: 'HR Signatory Designation', type: 'text' },
  ],
  relieving_letter: [
    { key: 'issueDate', label: 'Issue Date', type: 'date' },
    { key: 'joiningDate', label: 'Date of Joining', type: 'date' },
    { key: 'lastWorkingDate', label: 'Last Working Date', type: 'date' },
    { key: 'designation', label: 'Designation', type: 'text' },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'hrName', label: 'HR Signatory Name', type: 'text' },
    { key: 'hrDesignation', label: 'HR Signatory Designation', type: 'text' },
  ],
  increment_letter: [
    { key: 'issueDate', label: 'Issue Date', type: 'date' },
    { key: 'effectiveDate', label: 'Effective Date', type: 'date' },
    { key: 'previousSalary', label: 'Previous CTC (Annual)', type: 'number' },
    { key: 'newSalary', label: 'New CTC (Annual)', type: 'number' },
    { key: 'designation', label: 'Designation', type: 'text' },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
    { key: 'hrName', label: 'HR Signatory Name', type: 'text' },
    { key: 'hrDesignation', label: 'HR Signatory Designation', type: 'text' },
  ],
  salary_structure: [
    { key: 'effectiveDate', label: 'Effective Date', type: 'date' },
    { key: 'annualCTC', label: 'Annual CTC (Rs.)', type: 'number' },
    { key: 'designation', label: 'Designation', type: 'text' },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'joiningDate', label: 'Date of Joining', type: 'date' },
  ],
};

// ─── COMPONENT ─────────────────────────────────────────────────

const DocumentCreate = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [docType, setDocType] = useState('offer_letter');
  const [templateData, setTemplateData] = useState<Record<string, any>>({});
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyLogo, setCompanyLogo] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingDocId, setExistingDocId] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<'pdf' | 'docx'>('pdf');

  useEffect(() => {
    fetchEmployees();
    if (editId) loadDocument(editId);
  }, [editId]);

  // Auto-populate fields from employee data
  useEffect(() => {
    if (!selectedEmployee) return;
    const emp = selectedEmployee;
    setTemplateData(prev => ({
      ...prev,
      designation: prev.designation || emp.designation || '',
      department: prev.department || emp.department || '',
      joiningDate: prev.joiningDate || emp.joiningDate?.split('T')[0] || '',
      annualCTC: prev.annualCTC || emp.ctc?.annualCTC || (emp.salary ? emp.salary * 12 : ''),
      previousSalary: prev.previousSalary || emp.ctc?.annualCTC || (emp.salary ? emp.salary * 12 : ''),
      ctcBreakdown: emp.ctc?.annualCTC ? emp.ctc : null,
      employeeName: emp.name,
      employeeAddress: emp.address || '',
    }));
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/employees?limit=200');
      setEmployees(data.employees);
    } catch (error) {
      toast.error('Failed to fetch employees');
    }
  };

  const loadDocument = async (id: string) => {
    try {
      const { data } = await api.get(`/documents/${id}`);
      setDocType(data.type);
      setTemplateData(data.data || {});
      setCompanyName(data.companyName || '');
      setCompanyAddress(data.companyAddress || '');
      setCompanyLogo(data.companyLogo || '');
      setExistingDocId(data._id);
      if (data.employee) {
        setSelectedEmployee(data.employee);
      }
    } catch (error) {
      toast.error('Failed to load document');
    }
  };

  const compressImage = (file: File, maxSize = 500 * 1024): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // If small enough, use as-is
        if (file.size <= maxSize) { resolve(dataUrl); return; }
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = Math.min(400 / img.width, 400 / img.height, 1);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          let quality = 0.8;
          let result = canvas.toDataURL('image/jpeg', quality);
          // Reduce quality iteratively if still too large
          while (result.length * 0.75 > maxSize && quality > 0.3) {
            quality -= 0.1;
            result = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(result);
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Logo must be under 10MB');
      return;
    }
    try {
      const compressed = await compressImage(file);
      if (file.size > 500 * 1024) {
        toast.success('Logo auto-compressed for optimal size');
      }
      setCompanyLogo(compressed);
    } catch {
      toast.error('Failed to process image');
    }
  };

  const handleFieldChange = (key: string, value: any) => {
    setTemplateData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (status: 'draft' | 'final' = 'draft'): Promise<string | null> => {
    if (!selectedEmployee) { toast.error('Please select an employee'); return null; }
    setSaving(true);
    try {
      const payload = {
        employee: selectedEmployee._id,
        type: docType,
        data: templateData,
        companyName,
        companyAddress,
        companyLogo,
        status,
      };
      if (existingDocId) {
        await api.put(`/documents/${existingDocId}`, payload);
        toast.success('Document updated');
        return existingDocId;
      } else {
        const { data } = await api.post('/documents', payload);
        setExistingDocId(data._id);
        toast.success('Document saved');
        return data._id;
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to save');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (format: 'pdf' | 'docx' = downloadFormat) => {
    let docId = existingDocId;
    if (!docId) {
      docId = await handleSave('final');
    }
    if (!docId) return;
    try {
      const endpoint = format === 'docx' ? `/documents/${docId}/download-docx` : `/documents/${docId}/download`;
      const mimeType = format === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';
      const ext = format === 'docx' ? '.docx' : '.pdf';
      const response = await api.get(endpoint, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${DOC_TYPES[docType]?.label || 'document'}_${selectedEmployee?.name || 'doc'}${ext}`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (error) {
      toast.error('Failed to download');
    }
  };

  const handlePrint = async () => {
    let docId = existingDocId;
    if (!docId) {
      docId = await handleSave('final');
    }
    if (!docId) return;
    try {
      const response = await api.get(`/documents/${docId}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const w = window.open(url, '_blank');
      if (w) {
        w.onload = () => {
          setTimeout(() => w.print(), 500);
        };
      }
    } catch (error) {
      toast.error('Failed to print');
    }
  };

  const fmtDate = (d: string) => {
    if (!d) return '_______________';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  };
  const fmtCurrency = (n: number) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;
  const fields = TEMPLATE_FIELDS[docType] || [];
  const emp = selectedEmployee || {};

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/documents')} className="p-2 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{editId ? 'Edit Document' : 'Create Document'}</h1>
            <p className="text-xs text-dark-400">Fill in details and see live preview</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => handleSave('draft')} disabled={saving} className="btn-secondary text-sm flex items-center gap-1.5">
            <Save size={14} /> Draft
          </button>
          <button onClick={() => handleSave('final')} disabled={saving} className="btn-primary text-sm flex items-center gap-1.5">
            <Save size={14} /> Finalize
          </button>
          <div className="flex items-center rounded-lg overflow-hidden border border-dark-600">
            <button onClick={() => handleDownload('pdf')} className="text-sm flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white transition-colors">
              <Download size={14} /> PDF
            </button>
            <button onClick={() => handleDownload('docx')} className="text-sm flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white transition-colors border-l border-dark-500">
              <FileType size={14} /> Word
            </button>
          </div>
          <button onClick={handlePrint} className="btn-secondary text-sm flex items-center gap-1.5">
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* Main Content: Form + Preview */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* LEFT: Form Panel */}
        <div className="w-[420px] flex-shrink-0 overflow-y-auto pr-1 space-y-4">
          {/* Document Type */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wide">Document Type</h3>
            <Select
              value={docType}
              onChange={(v) => { setDocType(v); setTemplateData({}); }}
              options={Object.entries(DOC_TYPES).map(([value, { label, category }]) => ({
                value,
                label: `${label} (${category})`,
              }))}
            />
          </div>

          {/* Employee Selection */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wide">Employee</h3>
            <Select
              value={selectedEmployee?._id || ''}
              onChange={(v) => {
                const e = employees.find((emp: any) => emp._id === v);
                setSelectedEmployee(e || null);
              }}
              placeholder="Select Employee"
              options={employees.map((e: any) => ({ value: e._id, label: `${e.name} (${e.employeeId})` }))}
            />
            {selectedEmployee && (
              <div className="bg-dark-700/30 rounded-lg p-3 text-xs text-dark-300 space-y-0.5">
                <p>{selectedEmployee.designation || 'N/A'} &bull; {selectedEmployee.department || 'N/A'}</p>
                <p className="text-dark-500">{selectedEmployee.email}</p>
              </div>
            )}
          </div>

          {/* Company Info */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wide">Company Details</h3>
            <div>
              <label className="block text-xs text-dark-400 mb-1">Company Name *</label>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input-dark text-sm" placeholder="Acme Corp" />
            </div>
            <div>
              <label className="block text-xs text-dark-400 mb-1">Company Address</label>
              <input value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="input-dark text-sm" placeholder="123 Business Park, Hyderabad" />
            </div>
            <div>
              <label className="block text-xs text-dark-400 mb-1">Company Logo</label>
              <div className="flex items-center gap-3">
                {companyLogo ? (
                  <div className="relative group">
                    <img src={companyLogo} alt="Logo" className="h-10 rounded-lg bg-white p-1" />
                    <button onClick={() => setCompanyLogo('')} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                  </div>
                ) : null}
                <button onClick={() => logoInputRef.current?.click()} className="btn-secondary text-xs flex items-center gap-1.5">
                  <Upload size={12} /> {companyLogo ? 'Change' : 'Upload Logo'}
                </button>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </div>
            </div>
          </div>

          {/* Template Fields */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wide">
              {DOC_TYPES[docType]?.label || 'Document'} Details
            </h3>
            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs text-dark-400 mb-1">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={templateData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="input-dark text-sm min-h-[60px] resize-y"
                    placeholder={field.placeholder}
                    rows={2}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={templateData[field.key] || ''}
                    onChange={(e) => handleFieldChange(field.key, field.type === 'number' ? Number(e.target.value) || '' : e.target.value)}
                    className="input-dark text-sm"
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Live Preview Panel */}
        <div className="flex-1 bg-dark-700/20 rounded-xl border border-dark-700/50 overflow-y-auto flex justify-center p-6">
          <div
            className="bg-white shadow-2xl relative rounded-sm"
            style={{
              width: '595px',
              minHeight: '842px',
              padding: '0',
              fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
              fontSize: '11px',
              color: '#1f2937',
              lineHeight: '1.7',
            }}
          >
            {/* Watermark */}
            {companyLogo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                <img src={companyLogo} alt="" className="w-52 h-52 object-contain" style={{ opacity: 0.04 }} />
              </div>
            )}

            {/* Top gradient accent bar */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 50%, #1e3a8a 100%)' }} />

            {/* Content (above watermark) */}
            <div className="relative z-10" style={{ padding: '40px 48px 48px 48px' }}>
              {/* Header — logo beside text, no overlap */}
              <div className="flex items-center gap-4 pb-4 mb-6" style={{ borderBottom: '2px solid #e5e7eb' }}>
                {companyLogo && (
                  <div className="flex-shrink-0 p-1 rounded-lg" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <img src={companyLogo} alt="Logo" className="h-12 w-auto object-contain" style={{ maxWidth: '120px' }} />
                  </div>
                )}
                <div className={companyLogo ? 'flex-1 min-w-0' : 'w-full text-center'}>
                  <h1 className="text-lg font-bold tracking-tight" style={{ color: '#0f172a', fontFamily: '"Inter", sans-serif', margin: 0, lineHeight: '1.3' }}>
                    {companyName || 'Company Name'}
                  </h1>
                  {companyAddress && <p className="text-[9px] mt-0.5" style={{ color: '#64748b', fontFamily: '"Inter", sans-serif' }}>{companyAddress}</p>}
                </div>
              </div>

              {/* Template-specific content */}
              {docType === 'offer_letter' && <OfferLetterPreview data={templateData} emp={emp} companyName={companyName} fmtDate={fmtDate} fmtCurrency={fmtCurrency} />}
              {docType === 'appointment_letter' && <AppointmentLetterPreview data={templateData} emp={emp} companyName={companyName} fmtDate={fmtDate} />}
              {docType === 'experience_letter' && <ExperienceLetterPreview data={templateData} emp={emp} companyName={companyName} fmtDate={fmtDate} />}
              {docType === 'relieving_letter' && <RelievingLetterPreview data={templateData} emp={emp} companyName={companyName} fmtDate={fmtDate} />}
              {docType === 'increment_letter' && <IncrementLetterPreview data={templateData} emp={emp} companyName={companyName} fmtDate={fmtDate} fmtCurrency={fmtCurrency} />}
              {docType === 'salary_structure' && <SalaryStructurePreview data={templateData} emp={emp} companyName={companyName} fmtDate={fmtDate} fmtCurrency={fmtCurrency} />}

              {/* Footer */}
              <div className="mt-12 pt-4" style={{ borderTop: '1px solid #e5e7eb' }}>
                <p className="text-center text-[8px]" style={{ color: '#94a3b8', fontFamily: '"Inter", sans-serif' }}>
                  This is a computer-generated document. No signature required unless specified.
                </p>
              </div>
            </div>

            {/* Bottom gradient accent bar */}
            <div style={{ height: '3px', background: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 50%, #1e3a8a 100%)', marginTop: 'auto' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── TEMPLATE PREVIEWS ─────────────────────────────────────────

const SansText = ({ children, className = '', ...props }: any) => (
  <span style={{ fontFamily: 'Helvetica, Arial, sans-serif' }} className={className} {...props}>{children}</span>
);

const DocTitle = ({ children }: { children: string }) => (
  <div className="text-center mb-6">
    <h2 className="font-bold text-sm tracking-[3px] uppercase" style={{ color: '#0f172a', fontFamily: '"Inter", sans-serif' }}>
      {children}
    </h2>
    <div className="mx-auto mt-2" style={{ width: '40px', height: '3px', background: 'linear-gradient(90deg, #3b82f6, #1e3a8a)', borderRadius: '2px' }} />
  </div>
);

const SignBlock = ({ companyName, name, designation }: { companyName: string; name: string; designation: string }) => (
  <div className="mt-10">
    <p className="text-[10px]" style={{ color: '#374151' }}>For <strong>{companyName || '[Company Name]'}</strong>,</p>
    <div className="mt-8 text-[10px]">
      <div style={{ width: '160px', borderBottom: '1.5px solid #1e3a8a', marginBottom: '6px' }} />
      <p className="font-bold" style={{ color: '#0f172a' }}>{name || 'Authorized Signatory'}</p>
      <p style={{ color: '#64748b' }}>{designation || 'Human Resources'}</p>
    </div>
  </div>
);

const PreviewTable = ({ headers, rows }: { headers: string[]; rows: string[][] }) => (
  <table className="w-full text-[10px] border-collapse my-3" style={{ fontFamily: '"Inter", sans-serif' }}>
    <thead>
      <tr>
        {headers.map((h, i) => (
          <th key={i} className="px-3 py-2 text-left font-semibold text-[9px] uppercase tracking-wider"
            style={{ color: '#ffffff', background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', borderBottom: 'none' }}>
            {h}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, r) => (
        <tr key={r} style={{ backgroundColor: r % 2 === 0 ? '#f8fafc' : '#ffffff' }}>
          {row.map((cell, c) => (
            <td key={c} className="px-3 py-1.5" style={{ borderBottom: '1px solid #e2e8f0', color: '#334155' }}>{cell}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

// ── OFFER LETTER ────────────────────────────────────────────────
const OfferLetterPreview = ({ data, emp, companyName, fmtDate, fmtCurrency }: any) => {
  const name = emp.name || data.employeeName || '[Employee Name]';
  const ctc = data.ctcBreakdown || emp.ctc || null;
  const rows: string[][] = [];
  if (ctc && ctc.basic) {
    rows.push(['Basic Salary', fmtCurrency(ctc.basic), fmtCurrency(Math.round(ctc.basic / 12))]);
    rows.push(['HRA', fmtCurrency(ctc.hra), fmtCurrency(Math.round(ctc.hra / 12))]);
    rows.push(['Special Allowance', fmtCurrency(ctc.specialAllowance), fmtCurrency(Math.round(ctc.specialAllowance / 12))]);
    if (ctc.conveyanceAllowance) rows.push(['Conveyance', fmtCurrency(ctc.conveyanceAllowance), fmtCurrency(Math.round(ctc.conveyanceAllowance / 12))]);
    if (ctc.medicalAllowance) rows.push(['Medical', fmtCurrency(ctc.medicalAllowance), fmtCurrency(Math.round(ctc.medicalAllowance / 12))]);
    rows.push(['Employer PF', fmtCurrency(ctc.epfEmployer), fmtCurrency(Math.round(ctc.epfEmployer / 12))]);
    rows.push(['Gratuity', fmtCurrency(ctc.gratuity), fmtCurrency(Math.round(ctc.gratuity / 12))]);
    if (ctc.insurance) rows.push(['Insurance', fmtCurrency(ctc.insurance), fmtCurrency(Math.round(ctc.insurance / 12))]);
    if (ctc.variablePay) rows.push(['Variable Pay', fmtCurrency(ctc.variablePay), fmtCurrency(Math.round(ctc.variablePay / 12))]);
    rows.push(['Total CTC', fmtCurrency(data.annualCTC), fmtCurrency(Math.round((data.annualCTC || 0) / 12))]);
  }

  return (
    <div>
      <DocTitle>OFFER LETTER</DocTitle>
      <p className="text-[10px] text-gray-500 mb-1">Date: {fmtDate(data.issueDate)}</p>
      <p className="text-[10px] text-gray-500 mb-4">Ref: OL/{new Date().getFullYear()}/XXXX</p>

      <p className="font-bold text-[10px]">To,</p>
      <p className="text-[10px] mb-1">{name}</p>
      {(emp.address || data.employeeAddress) && <p className="text-[10px] text-gray-600 mb-4">{emp.address || data.employeeAddress}</p>}

      <p className="font-bold text-[10px] mb-3">Subject: Offer of Employment</p>

      <p className="text-[10px] mb-3">Dear {name},</p>
      <p className="text-[10px] mb-3">
        We are pleased to offer you the position of <strong>{data.designation || emp.designation || '[Designation]'}</strong> in
        the <strong>{data.department || emp.department || '[Department]'}</strong> department at <strong>{companyName || '[Company Name]'}</strong>,
        effective from <strong>{fmtDate(data.joiningDate || emp.joiningDate)}</strong>.
      </p>

      {data.annualCTC && (
        <p className="text-[10px] mb-3">
          Your annual compensation (CTC) will be <strong>Rs. {Number(data.annualCTC).toLocaleString('en-IN')}</strong> per annum.
        </p>
      )}

      {rows.length > 0 && (
        <>
          <p className="font-bold text-[10px] mb-1">Compensation Breakdown:</p>
          <PreviewTable headers={['Component', 'Annual (Rs.)', 'Monthly (Rs.)']} rows={rows} />
        </>
      )}

      <p className="font-bold text-[10px] mb-2 mt-4">Terms & Conditions:</p>
      <ol className="text-[10px] list-decimal list-inside space-y-1 mb-4">
        <li>Probation Period: {data.probationPeriod || '6'} months</li>
        <li>Notice Period: {data.noticePeriod || '1'} month(s)</li>
        <li>Work Location: {data.workLocation || '[Work Location]'}</li>
        <li>Reporting To: {data.reportingManager || '[Reporting Manager]'}</li>
      </ol>

      <p className="text-[10px] mb-2">Please sign and return this letter as your acceptance of the above terms.</p>
      <p className="text-[10px]">We welcome you and look forward to a long and successful association.</p>

      <SignBlock companyName={companyName} name={data.hrName} designation={data.hrDesignation} />

      <div className="mt-10">
        <p className="font-bold text-[10px] mb-4">Employee Acceptance:</p>
        <p className="text-[10px] mb-6">I accept the terms and conditions as stated above.</p>
        <p className="text-[10px]">____________________________</p>
        <p className="text-[10px] mt-1">{name}</p>
        <p className="text-[10px] text-gray-500">Date: _______________</p>
      </div>
    </div>
  );
};

// ── APPOINTMENT LETTER ──────────────────────────────────────────
const AppointmentLetterPreview = ({ data, emp, companyName, fmtDate }: any) => {
  const name = emp.name || data.employeeName || '[Employee Name]';
  return (
    <div>
      <DocTitle>APPOINTMENT LETTER</DocTitle>
      <p className="text-[10px] text-gray-500 mb-4">Date: {fmtDate(data.issueDate)}</p>
      <p className="font-bold text-[10px]">To,</p>
      <p className="text-[10px] mb-4">{name}</p>
      <p className="font-bold text-[10px] mb-3">Subject: Letter of Appointment</p>
      <p className="text-[10px] mb-3">Dear {name},</p>
      <p className="text-[10px] mb-3">
        With reference to your application and subsequent interview, we are pleased to appoint you
        as <strong>{data.designation || emp.designation || '[Designation]'}</strong> in
        the <strong>{data.department || emp.department || '[Department]'}</strong> department
        at <strong>{companyName || '[Company Name]'}</strong>, with effect
        from <strong>{fmtDate(data.joiningDate || emp.joiningDate)}</strong>.
      </p>
      <p className="font-bold text-[10px] mb-2">Terms of Appointment:</p>
      <ol className="text-[10px] list-decimal list-inside space-y-1.5 mb-4">
        <li>Designation: {data.designation || emp.designation || '[Designation]'}</li>
        <li>Department: {data.department || emp.department || '[Department]'}</li>
        <li>Date of Joining: {fmtDate(data.joiningDate || emp.joiningDate)}</li>
        <li>Probation Period: {data.probationPeriod || '6'} months from date of joining</li>
        <li>Notice Period: {data.noticePeriod || '1'} month(s) from either side</li>
        <li>Work Location: {data.workLocation || '[Work Location]'}</li>
        <li>Working Hours: {data.workingHours || '9:00 AM to 6:00 PM, Monday to Friday'}</li>
        <li>Compensation: Annual CTC of Rs. {Number(data.annualCTC || emp.salary * 12 || 0).toLocaleString('en-IN')}</li>
        <li>Confidentiality: You shall not disclose any confidential information of the company.</li>
        <li>Code of Conduct: You are expected to adhere to company policies.</li>
      </ol>
      <p className="text-[10px]">Kindly sign the duplicate copy as a token of your acceptance. We wish you a successful career with us.</p>
      <SignBlock companyName={companyName} name={data.hrName} designation={data.hrDesignation} />
    </div>
  );
};

// ── EXPERIENCE LETTER ───────────────────────────────────────────
const ExperienceLetterPreview = ({ data, emp, companyName, fmtDate }: any) => {
  const name = emp.name || data.employeeName || '[Employee Name]';
  return (
    <div>
      <DocTitle>EXPERIENCE LETTER</DocTitle>
      <p className="text-[10px] text-gray-500 mb-4">Date: {fmtDate(data.issueDate)}</p>
      <p className="text-center font-bold text-[10px] mb-5">TO WHOM IT MAY CONCERN</p>
      <p className="text-[10px] mb-3">
        This is to certify that <strong>{name}</strong> (Employee ID: {emp.employeeId || '[ID]'}) was employed
        with <strong>{companyName || '[Company Name]'}</strong> from <strong>{fmtDate(data.joiningDate || emp.joiningDate)}</strong> to <strong>{fmtDate(data.lastWorkingDate)}</strong> in
        the capacity of <strong>{data.designation || emp.designation || '[Designation]'}</strong> in
        the <strong>{data.department || emp.department || '[Department]'}</strong> department.
      </p>
      <p className="text-[10px] mb-3">
        During the tenure with us, we found {name} to be sincere, dedicated, and hardworking.
        {data.performanceNote ? ` ${data.performanceNote}` : ' Their conduct and performance have been satisfactory throughout their employment.'}
      </p>
      <p className="text-[10px] mb-2">We wish {name} all the best in future endeavors.</p>
      <p className="text-[10px]">This certificate is issued on request for any purpose it may serve.</p>
      <SignBlock companyName={companyName} name={data.hrName} designation={data.hrDesignation} />
    </div>
  );
};

// ── RELIEVING LETTER ────────────────────────────────────────────
const RelievingLetterPreview = ({ data, emp, companyName, fmtDate }: any) => {
  const name = emp.name || data.employeeName || '[Employee Name]';
  return (
    <div>
      <DocTitle>RELIEVING LETTER</DocTitle>
      <p className="text-[10px] text-gray-500 mb-4">Date: {fmtDate(data.issueDate)}</p>
      <p className="font-bold text-[10px]">To,</p>
      <p className="text-[10px]">{name}</p>
      <p className="text-[10px] text-gray-500 mb-4">Employee ID: {emp.employeeId || '[ID]'}</p>
      <p className="font-bold text-[10px] mb-3">Subject: Relieving from Services</p>
      <p className="text-[10px] mb-3">Dear {name},</p>
      <p className="text-[10px] mb-3">
        This is to inform you that your resignation has been accepted and you are relieved from your duties
        at <strong>{companyName || '[Company Name]'}</strong> effective <strong>{fmtDate(data.lastWorkingDate)}</strong>.
      </p>
      <p className="text-[10px] mb-3">
        You were working as <strong>{data.designation || emp.designation || '[Designation]'}</strong> in
        the <strong>{data.department || emp.department || '[Department]'}</strong> department
        since <strong>{fmtDate(data.joiningDate || emp.joiningDate)}</strong>.
      </p>
      <p className="text-[10px] mb-3">
        We confirm that all company assets have been returned and all dues have been settled.
        You are released from all your obligations towards the company.
      </p>
      <p className="text-[10px]">We thank you for your contributions and wish you all the best in your future endeavors.</p>
      <SignBlock companyName={companyName} name={data.hrName} designation={data.hrDesignation} />
    </div>
  );
};

// ── INCREMENT LETTER ────────────────────────────────────────────
const IncrementLetterPreview = ({ data, emp, companyName, fmtDate, fmtCurrency }: any) => {
  const name = emp.name || data.employeeName || '[Employee Name]';
  const increment = (data.newSalary || 0) - (data.previousSalary || 0);
  const pct = data.previousSalary ? ((increment / data.previousSalary) * 100).toFixed(1) : '0';
  return (
    <div>
      <DocTitle>SALARY REVISION LETTER</DocTitle>
      <p className="text-[10px] text-gray-500 mb-1">Date: {fmtDate(data.issueDate)}</p>
      <p className="text-[10px] text-right text-red-700 font-bold mb-3">CONFIDENTIAL</p>
      <p className="font-bold text-[10px]">To,</p>
      <p className="text-[10px]">{name}</p>
      <p className="text-[10px] text-gray-500">Employee ID: {emp.employeeId || '[ID]'}</p>
      <p className="text-[10px] text-gray-500 mb-4">Department: {data.department || emp.department || '[Department]'}</p>
      <p className="font-bold text-[10px] mb-3">Subject: Salary Revision</p>
      <p className="text-[10px] mb-3">Dear {name},</p>
      <p className="text-[10px] mb-3">
        Based on your performance and contribution to the organization, we are pleased to inform you
        that your compensation has been revised with effect from <strong>{fmtDate(data.effectiveDate)}</strong>.
      </p>
      <PreviewTable
        headers={['Particulars', 'Amount']}
        rows={[
          ['Previous CTC (Annual)', fmtCurrency(data.previousSalary)],
          ['Revised CTC (Annual)', fmtCurrency(data.newSalary)],
          ['Increment Amount', fmtCurrency(increment)],
          ['Increment %', `${pct}%`],
        ]}
      />
      {data.remarks && <p className="text-[10px] mb-3">Remarks: {data.remarks}</p>}
      <p className="text-[10px] mb-2">This revision is subject to the standard terms of your employment.</p>
      <p className="text-[10px]">Congratulations and we look forward to your continued contribution.</p>
      <SignBlock companyName={companyName} name={data.hrName} designation={data.hrDesignation} />
    </div>
  );
};

// ── SALARY STRUCTURE ────────────────────────────────────────────
const SalaryStructurePreview = ({ data, emp, companyName, fmtDate, fmtCurrency }: any) => {
  const name = emp.name || data.employeeName || '[Employee Name]';
  const ctc = data.ctcBreakdown || emp.ctc || {};

  const grossAnnual = (ctc.basic || 0) + (ctc.hra || 0) + (ctc.specialAllowance || 0) +
    (ctc.conveyanceAllowance || 0) + (ctc.medicalAllowance || 0) + (ctc.lta || 0);

  return (
    <div>
      <DocTitle>SALARY STRUCTURE</DocTitle>
      <p className="text-center text-[9px] text-gray-500 -mt-4 mb-4">(Confidential)</p>

      {/* Employee info grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px] mb-5">
        <p><span className="text-gray-500">Employee Name:</span> <strong>{name}</strong></p>
        <p><span className="text-gray-500">Employee ID:</span> <strong>{emp.employeeId || '[ID]'}</strong></p>
        <p><span className="text-gray-500">Designation:</span> <strong>{data.designation || emp.designation || '-'}</strong></p>
        <p><span className="text-gray-500">Department:</span> <strong>{data.department || emp.department || '-'}</strong></p>
        <p><span className="text-gray-500">Date of Joining:</span> <strong>{fmtDate(data.joiningDate || emp.joiningDate)}</strong></p>
        <p><span className="text-gray-500">Effective From:</span> <strong>{fmtDate(data.effectiveDate)}</strong></p>
      </div>

      {/* Fixed */}
      <p className="font-bold text-[10px] mb-1" style={{ color: '#166534' }}>A. Fixed Salary Components (Monthly Paid)</p>
      <PreviewTable
        headers={['Component', 'Annual (Rs.)', 'Monthly (Rs.)']}
        rows={[
          ['Basic Salary', fmtCurrency(ctc.basic), fmtCurrency(Math.round((ctc.basic || 0) / 12))],
          ['HRA', fmtCurrency(ctc.hra), fmtCurrency(Math.round((ctc.hra || 0) / 12))],
          ['Special Allowance', fmtCurrency(ctc.specialAllowance), fmtCurrency(Math.round((ctc.specialAllowance || 0) / 12))],
          ...(ctc.conveyanceAllowance ? [['Conveyance', fmtCurrency(ctc.conveyanceAllowance), fmtCurrency(Math.round(ctc.conveyanceAllowance / 12))]] : []),
          ...(ctc.medicalAllowance ? [['Medical', fmtCurrency(ctc.medicalAllowance), fmtCurrency(Math.round(ctc.medicalAllowance / 12))]] : []),
          ...(ctc.lta ? [['LTA', fmtCurrency(ctc.lta), fmtCurrency(Math.round(ctc.lta / 12))]] : []),
          ['Gross Salary', fmtCurrency(grossAnnual), fmtCurrency(Math.round(grossAnnual / 12))],
        ]}
      />

      {/* Employer */}
      <p className="font-bold text-[10px] mb-1 mt-4" style={{ color: '#9b1c1c' }}>B. Employer Contributions (Not in-hand)</p>
      <PreviewTable
        headers={['Component', 'Annual (Rs.)', 'Monthly (Rs.)']}
        rows={[
          ['Employer PF (12% of Basic)', fmtCurrency(ctc.epfEmployer), fmtCurrency(Math.round((ctc.epfEmployer || 0) / 12))],
          ['Gratuity (4.81% of Basic)', fmtCurrency(ctc.gratuity), fmtCurrency(Math.round((ctc.gratuity || 0) / 12))],
          ...(ctc.insurance ? [['Insurance', fmtCurrency(ctc.insurance), fmtCurrency(Math.round(ctc.insurance / 12))]] : []),
        ]}
      />

      {/* Variable */}
      {ctc.variablePay > 0 && (
        <>
          <p className="font-bold text-[10px] mb-1 mt-4" style={{ color: '#92400e' }}>C. Variable Pay</p>
          <PreviewTable
            headers={['Component', 'Annual (Rs.)', 'Monthly (Rs.)']}
            rows={[['Performance / Variable Pay', fmtCurrency(ctc.variablePay), fmtCurrency(Math.round(ctc.variablePay / 12))]]}
          />
        </>
      )}

      {/* Optional */}
      {(ctc.foodCoupons > 0 || ctc.transportAllowance > 0 || ctc.internetReimbursement > 0) && (
        <>
          <p className="font-bold text-[10px] mb-1 mt-4" style={{ color: '#6b21a8' }}>D. Optional Benefits & Perks</p>
          <PreviewTable
            headers={['Benefit', 'Annual (Rs.)', 'Monthly (Rs.)']}
            rows={[
              ...(ctc.foodCoupons ? [['Food Coupons', fmtCurrency(ctc.foodCoupons), fmtCurrency(Math.round(ctc.foodCoupons / 12))]] : []),
              ...(ctc.transportAllowance ? [['Transport', fmtCurrency(ctc.transportAllowance), fmtCurrency(Math.round(ctc.transportAllowance / 12))]] : []),
              ...(ctc.internetReimbursement ? [['Internet', fmtCurrency(ctc.internetReimbursement), fmtCurrency(Math.round(ctc.internetReimbursement / 12))]] : []),
            ]}
          />
        </>
      )}

      {/* Total CTC */}
      <div className="mt-4 p-3 rounded" style={{ backgroundColor: '#eef2ff', border: '1px solid #c7d2fe' }}>
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs" style={{ color: '#1e3a8a' }}>TOTAL ANNUAL CTC</span>
          <span className="font-bold text-sm" style={{ color: '#166534' }}>{fmtCurrency(data.annualCTC || 0)}</span>
        </div>
      </div>

      <p className="text-[8px] text-gray-400 mt-3">
        Note: Actual in-hand salary would be approximately 70-80% of CTC after statutory deductions (Employee PF, Professional Tax, TDS).
      </p>
    </div>
  );
};

export default DocumentCreate;

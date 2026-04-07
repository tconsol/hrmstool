import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload, Trash2, FileText, Check, AlertCircle, ChevronDown, ChevronUp, Save, User } from 'lucide-react';

interface DocMeta { url?: string; fileName?: string; uploadedAt?: string; gcsPath?: string }

const DOCUMENT_CATEGORIES = [
  {
    title: 'Identity Proof',
    icon: '🪪',
    docs: [
      { key: 'aadhaarCard', label: 'Aadhaar Card' },
      { key: 'panCard', label: 'PAN Card' },
      { key: 'passport', label: 'Passport' },
      { key: 'voterId', label: 'Voter ID' },
      { key: 'drivingLicense', label: 'Driving License' },
    ],
  },
  {
    title: 'Address Proof',
    icon: '🏠',
    docs: [
      { key: 'addressProof', label: 'Address Proof (Bill / Rental Agreement)' },
    ],
  },
  {
    title: 'Educational Documents',
    icon: '🎓',
    docs: [
      { key: 'sscCertificate', label: '10th (SSC) Certificate' },
      { key: 'hscCertificate', label: '12th (HSC) Certificate' },
      { key: 'graduationDegree', label: 'Graduation Degree' },
      { key: 'postGraduationDegree', label: 'Post-Graduation Degree' },
      { key: 'otherCertifications', label: 'Other Certifications' },
    ],
  },
  {
    title: 'Previous Employment',
    icon: '💼',
    docs: [
      { key: 'previousOfferLetter', label: 'Previous Offer Letter' },
      { key: 'previousAppointmentLetter', label: 'Previous Appointment Letter' },
      { key: 'salarySlips', label: 'Salary Slips (Last 3 months)' },
      { key: 'relievingLetter', label: 'Relieving Letter' },
      { key: 'experienceLetter', label: 'Experience Letter' },
      { key: 'form16', label: 'Form 16 (Last 1-2 years)' },
    ],
  },
  {
    title: 'Bank Details',
    icon: '💰',
    docs: [
      { key: 'bankPassbook', label: 'Bank Passbook' },
      { key: 'cancelledCheque', label: 'Cancelled Cheque' },
    ],
  },
  {
    title: 'Tax & Statutory',
    icon: '🧾',
    docs: [
      { key: 'pfForm11', label: 'Form 11 (PF Declaration)' },
      { key: 'uanCard', label: 'Previous UAN Card' },
    ],
  },
  {
    title: 'Medical & Insurance',
    icon: '🏥',
    docs: [
      { key: 'medicalCertificate', label: 'Medical Fitness Certificate' },
      { key: 'healthInsurance', label: 'Health Insurance Details' },
    ],
  },
  {
    title: 'Photographs',
    icon: '📸',
    docs: [
      { key: 'passportPhoto', label: 'Passport-size Photo' },
    ],
  },
  {
    title: 'Company-Specific Forms',
    icon: '✍️',
    docs: [
      { key: 'signedOfferLetter', label: 'Signed Offer Letter Acceptance' },
      { key: 'employmentAgreement', label: 'Employment Agreement' },
      { key: 'ndaAgreement', label: 'NDA (Non-Disclosure Agreement)' },
      { key: 'codeOfConduct', label: 'Code of Conduct Agreement' },
      { key: 'itAssetAcknowledgment', label: 'IT Asset Acknowledgment Form' },
    ],
  },
  {
    title: 'Additional Documents',
    icon: '🌍',
    docs: [
      { key: 'policeVerification', label: 'Police Verification' },
      { key: 'bgvConsent', label: 'Background Verification Consent Form' },
    ],
  },
];

export default function EmployeeDocuments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [employee, setEmployee] = useState<any>(null);
  const [organization, setOrganization] = useState<any>(null);
  const [docs, setDocs] = useState<Record<string, DocMeta>>({});
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeDocKey = useRef<string | null>(null);

  // Personal details form state
  const [personal, setPersonal] = useState({
    emergencyContact: { name: '', phone: '', relationship: '' },
    nomineeName: '',
    nomineeRelationship: '',
    bloodGroup: '',
    fatherName: '',
    dateOfBirth: '',
    bankAccountNumber: '',
    ifscCode: '',
    bankName: '',
    uan: '',
    panNumber: '',
    aadhaarNumber: '',
  });

  useEffect(() => {
    fetchDocuments();
  }, [id]);

  const fetchDocuments = async () => {
    try {
      const [{ data: empData }, { data: orgData }] = await Promise.all([
        api.get(`/employees/${id}/documents`),
        api.get(`/organization`),
      ]);
      
      setEmployee(empData);
      setOrganization(orgData);
      setDocs(empData.onboardingDocuments || {});
      setPersonal({
        emergencyContact: empData.emergencyContact || { name: '', phone: '', relationship: '' },
        nomineeName: empData.nomineeName || '',
        nomineeRelationship: empData.nomineeRelationship || '',
        bloodGroup: empData.bloodGroup || '',
        fatherName: empData.fatherName || '',
        dateOfBirth: empData.dateOfBirth ? empData.dateOfBirth.split('T')[0] : '',
        bankAccountNumber: empData.bankAccountNumber || '',
        ifscCode: empData.ifscCode || '',
        bankName: empData.bankName || '',
        uan: empData.uan || '',
        panNumber: empData.panNumber || '',
        aadhaarNumber: empData.aadhaarNumber || '',
      });
    } catch (err) {
      toast.error('Failed to fetch employee documents');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (title: string) => {
    setExpandedCategories(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const handleFileSelect = (docKey: string) => {
    activeDocKey.current = docKey;
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const docKey = activeDocKey.current;
    if (!file || !docKey) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPEG, PNG, WebP files are allowed');
      return;
    }

    setUploading(docKey);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docKey', docKey);

      const { data } = await api.post(`/employees/${id}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setDocs(prev => ({
        ...prev,
        [docKey]: { url: data.url, fileName: data.fileName, uploadedAt: data.uploadedAt },
      }));
      toast.success(`${file.name} uploaded`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to upload document');
    } finally {
      setUploading(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveDoc = async (docKey: string) => {
    if (!confirm('Remove this document?')) return;
    try {
      await api.delete(`/employees/${id}/documents/${docKey}`);
      setDocs(prev => {
        const updated = { ...prev };
        delete updated[docKey];
        return updated;
      });
      toast.success('Document removed');
    } catch {
      toast.error('Failed to remove document');
    }
  };

  const handleSavePersonal = async () => {
    setSaving(true);
    try {
      await api.put(`/employees/${id}/documents/personal`, personal);
      toast.success('Personal details saved');
    } catch {
      toast.error('Failed to save personal details');
    } finally {
      setSaving(false);
    }
  };

  const getUploadedCount = () => {
    let total = 0;
    let uploaded = 0;
    DOCUMENT_CATEGORIES.forEach(cat => {
      cat.docs.forEach(doc => {
        total++;
        if (docs[doc.key]?.url || docs[doc.key]?.gcsPath) uploaded++;
      });
    });
    return { total, uploaded };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { total, uploaded } = getUploadedCount();
  const progress = Math.round((uploaded / total) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/employees')} className="p-2 hover:bg-dark-700/50 rounded-lg text-dark-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Onboarding Documents</h1>
          <p className="text-dark-400 text-sm mt-1">
            {employee?.name} ({employee?.employeeId})
          </p>
        </div>
      </div>

      {/* Organization Info Card */}
      {organization && (
        <div className="glass-card p-4 bg-dark-800/50 border border-brand-500/20">
          <div className="flex gap-4">
            {organization.logo && (
              <img
                src={organization.logo}
                alt={organization.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{organization.name}</h3>
              {organization.address && (
                <p className="text-sm text-dark-300 mt-1">{organization.address}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-dark-300">Document Completion</span>
          <span className="text-sm font-semibold text-brand-400">{uploaded}/{total} uploaded ({progress}%)</span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-2.5">
          <div
            className="bg-brand-500 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Document Categories */}
      {DOCUMENT_CATEGORIES.map(category => {
        const catUploaded = category.docs.filter(d => docs[d.key]?.url || docs[d.key]?.gcsPath).length;
        const catTotal = category.docs.length;
        const isExpanded = expandedCategories[category.title] !== false; // default expanded

        return (
          <div key={category.title} className="glass-card overflow-hidden">
            <button
              onClick={() => toggleCategory(category.title)}
              className="w-full flex items-center justify-between p-4 hover:bg-dark-700/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{category.icon}</span>
                <h3 className="text-sm font-semibold text-white">{category.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${catUploaded === catTotal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-dark-600 text-dark-400'}`}>
                  {catUploaded}/{catTotal}
                </span>
              </div>
              {isExpanded ? <ChevronUp size={16} className="text-dark-400" /> : <ChevronDown size={16} className="text-dark-400" />}
            </button>

            {isExpanded && (
              <div className="border-t border-dark-700/50 divide-y divide-dark-700/30">
                {category.docs.map(doc => {
                  const docData = docs[doc.key];
                  const hasDoc = docData?.url || docData?.gcsPath;
                  const isCurrentlyUploading = uploading === doc.key;

                  return (
                    <div key={doc.key} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {hasDoc ? (
                          <Check size={16} className="text-emerald-400 flex-shrink-0" />
                        ) : (
                          <AlertCircle size={16} className="text-dark-500 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm ${hasDoc ? 'text-white' : 'text-dark-400'}`}>{doc.label}</p>
                          {hasDoc && docData.fileName && (
                            <p className="text-xs text-dark-500 truncate">{docData.fileName}</p>
                          )}
                          {hasDoc && docData.uploadedAt && (
                            <p className="text-xs text-dark-600">{new Date(docData.uploadedAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {hasDoc && (
                          <>
                            <a
                              href={docData.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-dark-400 hover:text-brand-400 hover:bg-dark-700/50 rounded-lg transition-colors"
                              title="View"
                            >
                              <FileText size={14} />
                            </a>
                            <button
                              onClick={() => handleRemoveDoc(doc.key)}
                              className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-dark-700/50 rounded-lg transition-colors"
                              title="Remove"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleFileSelect(doc.key)}
                          disabled={isCurrentlyUploading}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600 disabled:opacity-50"
                        >
                          {isCurrentlyUploading ? (
                            <div className="w-3 h-3 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Upload size={12} />
                          )}
                          {hasDoc ? 'Replace' : 'Upload'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Emergency & Personal Details */}
      <div className="glass-card p-6 space-y-5">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <User size={20} className="text-brand-400" />
          Emergency & Personal Details
        </h3>

        {/* Emergency Contact */}
        <div>
          <p className="text-xs font-semibold text-amber-400 mb-3 uppercase tracking-wide">Emergency Contact</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Contact Name</label>
              <input
                value={personal.emergencyContact.name}
                onChange={e => setPersonal(p => ({ ...p, emergencyContact: { ...p.emergencyContact, name: e.target.value } }))}
                className="input-dark" placeholder="Full Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Contact Phone</label>
              <input
                value={personal.emergencyContact.phone}
                onChange={e => setPersonal(p => ({ ...p, emergencyContact: { ...p.emergencyContact, phone: e.target.value } }))}
                className="input-dark" placeholder="9876543210"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Relationship</label>
              <input
                value={personal.emergencyContact.relationship}
                onChange={e => setPersonal(p => ({ ...p, emergencyContact: { ...p.emergencyContact, relationship: e.target.value } }))}
                className="input-dark" placeholder="e.g. Father, Spouse"
              />
            </div>
          </div>
        </div>

        {/* Nominee & Personal */}
        <div>
          <p className="text-xs font-semibold text-purple-400 mb-3 uppercase tracking-wide">Personal Information</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Father's Name</label>
              <input value={personal.fatherName} onChange={e => setPersonal(p => ({ ...p, fatherName: e.target.value }))} className="input-dark" placeholder="Father's Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Date of Birth</label>
              <input type="date" value={personal.dateOfBirth} onChange={e => setPersonal(p => ({ ...p, dateOfBirth: e.target.value }))} className="input-dark" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Blood Group</label>
              <input value={personal.bloodGroup} onChange={e => setPersonal(p => ({ ...p, bloodGroup: e.target.value }))} className="input-dark" placeholder="e.g. O+, B+" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Nominee Name</label>
              <input value={personal.nomineeName} onChange={e => setPersonal(p => ({ ...p, nomineeName: e.target.value }))} className="input-dark" placeholder="Nominee Name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Nominee Relationship</label>
              <input value={personal.nomineeRelationship} onChange={e => setPersonal(p => ({ ...p, nomineeRelationship: e.target.value }))} className="input-dark" placeholder="e.g. Spouse, Parent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Aadhaar Number</label>
              <input value={personal.aadhaarNumber} onChange={e => setPersonal(p => ({ ...p, aadhaarNumber: e.target.value }))} className="input-dark" placeholder="XXXX XXXX XXXX" maxLength={14} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">PAN Number</label>
              <input value={personal.panNumber} onChange={e => setPersonal(p => ({ ...p, panNumber: e.target.value.toUpperCase() }))} className="input-dark" placeholder="ABCDE1234F" maxLength={10} />
            </div>
          </div>
        </div>

        {/* Bank & Statutory */}
        <div>
          <p className="text-xs font-semibold text-emerald-400 mb-3 uppercase tracking-wide">Bank & Statutory Details</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Bank Name</label>
              <input value={personal.bankName} onChange={e => setPersonal(p => ({ ...p, bankName: e.target.value }))} className="input-dark" placeholder="e.g. HDFC Bank" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">Account Number</label>
              <input value={personal.bankAccountNumber} onChange={e => setPersonal(p => ({ ...p, bankAccountNumber: e.target.value }))} className="input-dark" placeholder="Account Number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">IFSC Code</label>
              <input value={personal.ifscCode} onChange={e => setPersonal(p => ({ ...p, ifscCode: e.target.value.toUpperCase() }))} className="input-dark" placeholder="e.g. HDFC0001234" maxLength={11} />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-1.5">UAN Number</label>
              <input value={personal.uan} onChange={e => setPersonal(p => ({ ...p, uan: e.target.value }))} className="input-dark" placeholder="UAN Number" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSavePersonal}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
            Save Personal Details
          </button>
        </div>
      </div>
    </div>
  );
}

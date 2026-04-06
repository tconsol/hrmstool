import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  FileText,
  Plus,
  Download,
  Trash2,
  Filter,
  Briefcase,
  Award,
  Shield,
  BadgeDollarSign,
  UserCheck,
  FileCheck2,
  FileType,
} from 'lucide-react';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';

const DOC_TYPES: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  offer_letter: { label: 'Offer Letter', icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  appointment_letter: { label: 'Appointment Letter', icon: Briefcase, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  experience_letter: { label: 'Experience Letter', icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  relieving_letter: { label: 'Relieving Letter', icon: UserCheck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  increment_letter: { label: 'Increment Letter', icon: BadgeDollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
  salary_structure: { label: 'Salary Structure', icon: FileCheck2, color: 'text-purple-400', bg: 'bg-purple-500/10' },
};

const DocumentList = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, [typeFilter, statusFilter]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set('type', typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      params.set('limit', '50');
      const { data } = await api.get(`/documents?${params.toString()}`);
      setDocuments(data.documents);
    } catch (error) {
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id: string, title: string, format: 'pdf' | 'docx' = 'pdf') => {
    try {
      const endpoint = format === 'docx' ? `/documents/${id}/download-docx` : `/documents/${id}/download`;
      const mimeType = format === 'docx'
        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        : 'application/pdf';
      const ext = format === 'docx' ? '.docx' : '.pdf';
      const response = await api.get(endpoint, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}${ext}`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await api.delete(`/documents/${deleteId}`);
      toast.success('Document deleted');
      setDeleteId(null);
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handlePrint = async (id: string) => {
    try {
      const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => printWindow.print());
      }
    } catch (error) {
      toast.error('Failed to load document for printing');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-dark-400 text-sm mt-1">Manage employee documents and letters</p>
        </div>
        <button
          onClick={() => navigate('/documents/create')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Create Document
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            placeholder="All Types"
            options={Object.entries(DOC_TYPES).map(([value, { label }]) => ({ value, label }))}
            className="w-full sm:w-52"
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Status"
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'final', label: 'Final' },
            ]}
            className="w-full sm:w-40"
          />
        </div>
      </div>

      {/* Document Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText size={48} className="mx-auto text-dark-500 mb-4" />
          <p className="text-dark-400">No documents found</p>
          <button onClick={() => navigate('/documents/create')} className="btn-primary mt-4 inline-flex items-center gap-2">
            <Plus size={16} /> Create your first document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {documents.map((doc: any) => {
            const typeInfo = DOC_TYPES[doc.type] || DOC_TYPES.offer_letter;
            const Icon = typeInfo.icon;
            return (
              <div
                key={doc._id}
                className="glass-card p-5 hover:border-dark-600 transition-all group cursor-pointer"
                onClick={() => navigate(`/documents/create?edit=${doc._id}`)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2.5 rounded-lg ${typeInfo.bg} flex-shrink-0`}>
                    <Icon size={20} className={typeInfo.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{doc.title}</h3>
                    <p className="text-xs text-dark-400 mt-0.5">{typeInfo.label}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                    doc.status === 'final'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-amber-500/15 text-amber-400'
                  }`}>
                    {doc.status}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs text-dark-400">
                    <span>Employee:</span>
                    <span className="text-dark-200">{doc.employee?.name || 'N/A'}</span>
                    <span className="text-dark-600">({doc.employee?.employeeId})</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-dark-400">
                    <span>Created:</span>
                    <span className="text-dark-200">{new Date(doc.createdAt).toLocaleDateString('en-IN')}</span>
                    <span className="text-dark-500">by {doc.generatedBy?.name || 'HR'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(doc._id, doc.title, 'pdf'); }}
                    className="p-1.5 rounded-lg bg-brand-600/20 text-brand-400 hover:bg-brand-600/40 transition-colors"
                    title="Download PDF"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(doc._id, doc.title, 'docx'); }}
                    className="p-1.5 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/40 transition-colors"
                    title="Download Word"
                  >
                    <FileType size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrint(doc._id); }}
                    className="p-1.5 rounded-lg bg-dark-600/50 text-dark-300 hover:bg-dark-600 transition-colors"
                    title="Print"
                  >
                    <FileText size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteId(doc._id); }}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors ml-auto"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <Modal onClose={() => setDeleteId(null)}>
          <div className="glass-card p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold text-white">Delete Document?</h3>
            <p className="text-sm text-dark-400">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleDelete} className="btn-danger">Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DocumentList;

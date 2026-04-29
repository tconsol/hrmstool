import { useState, useEffect, useCallback } from 'react';
import { Plus, Download, Trash2, Pencil, FileText, TrendingUp, TrendingDown, Search, Eye } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Select from '../../components/ui/Select';
import { useConfirm } from '../../context/ConfirmContext';
import InvoiceForm from './InvoiceForm';

const STATUS_COLORS: Record<string, string> = {
  draft:     'bg-slate-600/30 text-slate-300',
  sent:      'bg-blue-600/30 text-blue-300',
  paid:      'bg-green-600/30 text-green-300',
  overdue:   'bg-red-600/30 text-red-300',
  cancelled: 'bg-gray-600/30 text-gray-400',
};

const fmtAmt = (n: number) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface SummaryEntry { _id: string; count: number; total: number }

export default function InvoiceList() {
  const confirm = useConfirm();

  const [invoices, setInvoices]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [typeFilter, setTypeFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]       = useState('');
  const [summary, setSummary]     = useState<{ outgoing: SummaryEntry[]; incoming: SummaryEntry[] } | null>(null);

  const [showForm, setShowForm]   = useState(false);
  const [editInvoice, setEditInvoice] = useState<any>(null);
  const [previewInvoice, setPreviewInvoice] = useState<any>(null);

  const LIMIT = 15;

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (typeFilter)   params.set('type',   typeFilter);
      if (statusFilter) params.set('status', statusFilter);
      if (search)       params.set('search', search);
      const { data } = await api.get(`/invoices?${params}`);
      setInvoices(data.invoices);
      setTotal(data.total);
    } catch { toast.error('Failed to load invoices'); }
    finally { setLoading(false); }
  }, [page, typeFilter, statusFilter, search]);

  const fetchSummary = async () => {
    try {
      const { data } = await api.get('/invoices/summary');
      setSummary(data);
    } catch { /* non-critical */ }
  };

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { fetchSummary(); }, []);

  const handleDelete = async (inv: any) => {
    const ok = await confirm({
      title: 'Delete Invoice',
      message: `Delete invoice ${inv.invoiceNumber}? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/invoices/${inv._id}`);
      toast.success('Invoice deleted');
      fetchInvoices();
      fetchSummary();
    } catch (err: any) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDownload = async (inv: any) => {
    try {
      const res = await api.get(`/invoices/${inv._id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a   = document.createElement('a');
      a.href = url;
      a.download = `${inv.invoiceNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to generate PDF'); }
  };

  const sumOf = (arr: SummaryEntry[], status?: string) => {
    if (!arr) return 0;
    const filtered = status ? arr.filter(e => e._id === status) : arr;
    return filtered.reduce((s, e) => s + e.total, 0);
  };
  const countOf = (arr: SummaryEntry[], status?: string) => {
    if (!arr) return 0;
    const filtered = status ? arr.filter(e => e._id === status) : arr;
    return filtered.reduce((s, e) => s + e.count, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText size={24} className="text-blue-400" />
            Invoices
          </h1>
          <p className="text-dark-400 text-sm mt-1">Manage sales & purchase invoices</p>
        </div>
        <button
          onClick={() => { setEditInvoice(null); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          New Invoice
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-green-400" />
              <span className="text-xs text-dark-400 uppercase tracking-wide">Sales Invoices</span>
            </div>
            <p className="text-2xl font-bold text-white">{countOf(summary.outgoing)}</p>
            <p className="text-sm text-green-400 mt-1">{fmtAmt(sumOf(summary.outgoing))}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-green-400" />
              <span className="text-xs text-dark-400 uppercase tracking-wide">Paid Received</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{countOf(summary.outgoing, 'paid')}</p>
            <p className="text-sm text-green-400 mt-1">{fmtAmt(sumOf(summary.outgoing, 'paid'))}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} className="text-red-400" />
              <span className="text-xs text-dark-400 uppercase tracking-wide">Purchase Invoices</span>
            </div>
            <p className="text-2xl font-bold text-white">{countOf(summary.incoming)}</p>
            <p className="text-sm text-red-400 mt-1">{fmtAmt(sumOf(summary.incoming))}</p>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown size={16} className="text-orange-400" />
              <span className="text-xs text-dark-400 uppercase tracking-wide">Overdue</span>
            </div>
            <p className="text-2xl font-bold text-orange-400">
              {countOf(summary.outgoing, 'overdue') + countOf(summary.incoming, 'overdue')}
            </p>
            <p className="text-sm text-orange-400 mt-1">
              {fmtAmt(sumOf(summary.outgoing, 'overdue') + sumOf(summary.incoming, 'overdue'))}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search invoice # or party…"
              className="input-dark pl-9 w-full"
            />
          </div>
          <Select
            value={typeFilter}
            onChange={v => { setTypeFilter(v); setPage(1); }}
            placeholder="All Types"
            options={[
              { value: 'outgoing', label: 'Sales (Outgoing)' },
              { value: 'incoming', label: 'Purchase (Incoming)' },
            ]}
            className="w-full sm:w-48"
          />
          <Select
            value={statusFilter}
            onChange={v => { setStatusFilter(v); setPage(1); }}
            placeholder="All Status"
            options={[
              { value: 'draft',     label: 'Draft' },
              { value: 'sent',      label: 'Sent' },
              { value: 'paid',      label: 'Paid' },
              { value: 'overdue',   label: 'Overdue' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            className="w-full sm:w-40"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="table-container">
            <table className="table-dark">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Type</th>
                  <th>Party</th>
                  <th className="hidden md:table-cell">Date</th>
                  <th className="hidden md:table-cell">Due</th>
                  <th className="hidden lg:table-cell">GST</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv._id}>
                    <td>
                      <span className="font-mono text-sm font-medium text-white">{inv.invoiceNumber}</span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${inv.type === 'outgoing' ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}`}>
                        {inv.type === 'outgoing' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {inv.type === 'outgoing' ? 'Sales' : 'Purchase'}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-white text-sm">{inv.party?.name}</p>
                        {inv.party?.gstin && <p className="text-xs text-dark-400 font-mono">{inv.party.gstin}</p>}
                      </div>
                    </td>
                    <td className="hidden md:table-cell text-dark-300 text-sm">
                      {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="hidden md:table-cell text-dark-300 text-sm">
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : 'On receipt'}
                    </td>
                    <td className="hidden lg:table-cell text-dark-300 text-sm">
                      {fmtAmt(inv.taxAmount)}
                    </td>
                    <td>
                      <span className="font-semibold text-white">{fmtAmt(inv.totalAmount)}</span>
                    </td>
                    <td>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[inv.status] || ''}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewInvoice(inv)}
                          className="p-1.5 text-dark-400 hover:text-blue-400 transition"
                          title="Preview"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDownload(inv)}
                          className="p-1.5 text-dark-400 hover:text-green-400 transition"
                          title="Download PDF"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => { setEditInvoice(inv); setShowForm(true); }}
                          className="p-1.5 text-dark-400 hover:text-white transition"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(inv)}
                          className="p-1.5 text-dark-400 hover:text-red-400 transition"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-dark-500">
                      No invoices found. Create your first invoice!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > LIMIT && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700">
              <p className="text-sm text-dark-400">
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page * LIMIT >= total}
                  className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit form */}
      {showForm && (
        <InvoiceForm
          invoice={editInvoice}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchInvoices(); fetchSummary(); }}
        />
      )}

      {/* Preview modal */}
      {previewInvoice && (
        <InvoicePreview invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} onDownload={handleDownload} />
      )}
    </div>
  );
}

// ── Inline Preview modal ─────────────────────────────────────────────────────
function InvoicePreview({ invoice, onClose, onDownload }: { invoice: any; onClose: () => void; onDownload: (inv: any) => void }) {
  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
  const fmtAmt2  = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 bg-black/70 z-[9000] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-dark-400 uppercase tracking-wide mb-1">
                {invoice.type === 'incoming' ? 'Purchase Invoice' : 'Tax Invoice'}
              </p>
              <h2 className="text-xl font-bold text-white font-mono">{invoice.invoiceNumber}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[invoice.status] || ''}`}>
                {invoice.status}
              </span>
              <button onClick={() => onDownload(invoice)} className="btn-primary flex items-center gap-1.5 text-sm">
                <Download size={14} /> PDF
              </button>
              <button onClick={onClose} className="btn-secondary text-sm">✕</button>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-dark-400 text-xs mb-1 uppercase">From</p>
              <p className="text-white font-semibold">Your Organization</p>
            </div>
            <div>
              <p className="text-dark-400 text-xs mb-1 uppercase">{invoice.type === 'incoming' ? 'Vendor' : 'Bill To'}</p>
              <p className="text-white font-semibold">{invoice.party?.name}</p>
              {invoice.party?.address && <p className="text-dark-400 text-xs">{invoice.party.address}</p>}
              {invoice.party?.gstin && <p className="text-dark-400 text-xs font-mono">GSTIN: {invoice.party.gstin}</p>}
            </div>
          </div>

          {/* Dates */}
          <div className="flex gap-6 text-sm">
            <div><span className="text-dark-400">Date:</span> <span className="text-white ml-1">{fmtDate(invoice.invoiceDate)}</span></div>
            <div><span className="text-dark-400">Due:</span> <span className="text-white ml-1">{invoice.dueDate ? fmtDate(invoice.dueDate) : 'On receipt'}</span></div>
          </div>

          {/* Line items */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-600">
                  <th className="text-left text-dark-400 py-2 pr-4">Description</th>
                  <th className="text-right text-dark-400 py-2 px-2">Qty</th>
                  <th className="text-right text-dark-400 py-2 px-2">Rate</th>
                  <th className="text-right text-dark-400 py-2 px-2">GST%</th>
                  <th className="text-right text-dark-400 py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(invoice.lineItems || []).map((item: any, i: number) => (
                  <tr key={i} className="border-b border-dark-700/50">
                    <td className="text-white py-2 pr-4">{item.description}</td>
                    <td className="text-dark-300 py-2 px-2 text-right">{item.quantity}</td>
                    <td className="text-dark-300 py-2 px-2 text-right">{fmtAmt2(item.unitPrice)}</td>
                    <td className="text-dark-300 py-2 px-2 text-right">{item.taxRate}%</td>
                    <td className="text-white font-medium py-2 text-right">{fmtAmt2(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex flex-col items-end gap-1 text-sm border-t border-dark-600 pt-4">
            <div className="flex gap-8 text-dark-300">
              <span>Subtotal</span><span className="text-white">{fmtAmt2(invoice.subtotal)}</span>
            </div>
            <div className="flex gap-8 text-dark-300">
              <span>GST Amount</span><span className="text-white">{fmtAmt2(invoice.taxAmount)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex gap-8 text-dark-300">
                <span>Discount</span><span className="text-green-400">-{fmtAmt2(invoice.discount)}</span>
              </div>
            )}
            <div className="flex gap-8 text-lg font-bold border-t border-dark-600 pt-2 mt-1">
              <span className="text-white">Total</span><span className="text-blue-400">{fmtAmt2(invoice.totalAmount)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="text-sm">
              <p className="text-dark-400 mb-1">Notes</p>
              <p className="text-dark-300">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

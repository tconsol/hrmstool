import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import DatePicker from '../../components/ui/DatePicker';

interface LineItem {
  description: string;
  hsn: string;
  quantity: number | string;
  unitPrice: number | string;
  taxRate: number | string;
  amount: number;
}

const emptyItem = (): LineItem => ({
  description: '', hsn: '', quantity: 1, unitPrice: 0, taxRate: 18, amount: 0,
});

const calcItem = (item: LineItem): LineItem => {
  const qty   = parseFloat(String(item.quantity))   || 0;
  const price = parseFloat(String(item.unitPrice))  || 0;
  return { ...item, amount: parseFloat((qty * price).toFixed(2)) };
};

const calcTotals = (items: LineItem[], discount: number | string) => {
  const subtotal   = items.reduce((s, it) => s + it.amount, 0);
  const taxAmount  = items.reduce((s, it) => s + (it.amount * (parseFloat(String(it.taxRate)) || 0)) / 100, 0);
  const disc       = parseFloat(String(discount)) || 0;
  const totalAmount = Math.max(0, subtotal + taxAmount - disc);
  return {
    subtotal:    parseFloat(subtotal.toFixed(2)),
    taxAmount:   parseFloat(taxAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  };
};

const fmtAmt = (n: number) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
  invoice?: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function InvoiceForm({ invoice, onClose, onSaved }: Props) {
  const isEdit = !!invoice;

  const today = new Date().toISOString().split('T')[0];
  const defaultDue = new Date(Date.now() + 30 * 86400_000).toISOString().split('T')[0];

  const [type, setType]               = useState<string>(invoice?.type || 'outgoing');
  const [invoiceDate, setInvoiceDate] = useState(invoice?.invoiceDate ? new Date(invoice.invoiceDate).toISOString().split('T')[0] : today);
  const [dueDate, setDueDate]         = useState(invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : defaultDue);
  const [status, setStatus]           = useState(invoice?.status || 'draft');
  const [paymentTerms, setPaymentTerms] = useState(invoice?.paymentTerms || '');
  const [notes, setNotes]             = useState(invoice?.notes || '');
  const [discount, setDiscount]       = useState<number | string>(invoice?.discount || 0);

  const [party, setParty] = useState({
    name:    invoice?.party?.name    || '',
    email:   invoice?.party?.email   || '',
    phone:   invoice?.party?.phone   || '',
    address: invoice?.party?.address || '',
    gstin:   invoice?.party?.gstin   || '',
    state:   invoice?.party?.state   || '',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>(
    invoice?.lineItems?.length
      ? invoice.lineItems.map((it: any) => ({ ...it }))
      : [emptyItem()]
  );

  const [saving, setSaving] = useState(false);

  const { subtotal, taxAmount, totalAmount } = calcTotals(lineItems, discount);

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setLineItems(prev => {
      const updated = [...prev];
      updated[idx] = calcItem({ ...updated[idx], [field]: value });
      return updated;
    });
  };

  const addItem    = () => setLineItems(prev => [...prev, emptyItem()]);
  const removeItem = (idx: number) => setLineItems(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!party.name.trim()) { toast.error('Party name is required'); return; }
    if (lineItems.length === 0) { toast.error('Add at least one line item'); return; }
    if (lineItems.some(it => !it.description.trim())) { toast.error('All items must have a description'); return; }

    setSaving(true);
    try {
      const payload = {
        type,
        invoiceDate,
        dueDate:      dueDate || undefined,
        party,
        lineItems,
        discount,
        paymentTerms,
        notes,
        status,
      };
      if (isEdit) {
        await api.put(`/invoices/${invoice._id}`, payload);
        toast.success('Invoice updated');
      } else {
        await api.post('/invoices', payload);
        toast.success('Invoice created');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="glass-card w-full max-w-4xl max-h-[95vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {isEdit ? `Edit Invoice — ${invoice.invoiceNumber}` : 'Create Invoice'}
            </h2>
            <button onClick={onClose} className="text-dark-400 hover:text-white transition">
              <X size={20} />
            </button>
          </div>

          {/* Invoice meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">Invoice Type *</label>
              <Select
                value={type}
                onChange={setType}
                options={[
                  { value: 'outgoing', label: 'Sales (We Provide)' },
                  { value: 'incoming', label: 'Purchase (We Receive)' },
                ]}
              />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">Invoice Date *</label>
              <DatePicker value={invoiceDate} onChange={setInvoiceDate} />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">Due Date</label>
              <DatePicker value={dueDate} onChange={setDueDate} />
            </div>
            <div>
              <label className="block text-sm text-dark-300 mb-1.5">Status</label>
              <Select
                value={status}
                onChange={setStatus}
                options={[
                  { value: 'draft',     label: 'Draft' },
                  { value: 'sent',      label: 'Sent' },
                  { value: 'paid',      label: 'Paid' },
                  { value: 'overdue',   label: 'Overdue' },
                  { value: 'cancelled', label: 'Cancelled' },
                ]}
              />
            </div>
          </div>

          {/* Party details */}
          <div>
            <h3 className="text-sm font-semibold text-dark-200 uppercase tracking-wide mb-3">
              {type === 'incoming' ? 'Vendor Details' : 'Client Details'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <label className="block text-xs text-dark-400 mb-1">Name *</label>
                <input
                  value={party.name}
                  onChange={e => setParty(p => ({ ...p, name: e.target.value }))}
                  placeholder="Company / Person name"
                  className="input-dark w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-400 mb-1">Email</label>
                <input
                  type="email"
                  value={party.email}
                  onChange={e => setParty(p => ({ ...p, email: e.target.value }))}
                  placeholder="email@example.com"
                  className="input-dark w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-400 mb-1">Phone</label>
                <input
                  value={party.phone}
                  onChange={e => setParty(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+91 9999999999"
                  className="input-dark w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-400 mb-1">GSTIN</label>
                <input
                  value={party.gstin}
                  onChange={e => setParty(p => ({ ...p, gstin: e.target.value.toUpperCase() }))}
                  placeholder="15-char GST number"
                  maxLength={15}
                  className="input-dark w-full font-mono tracking-wider"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-400 mb-1">State</label>
                <input
                  value={party.state}
                  onChange={e => setParty(p => ({ ...p, state: e.target.value }))}
                  placeholder="e.g. Telangana"
                  className="input-dark w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-400 mb-1">Address</label>
                <input
                  value={party.address}
                  onChange={e => setParty(p => ({ ...p, address: e.target.value }))}
                  placeholder="Street, City, PIN"
                  className="input-dark w-full"
                />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-dark-200 uppercase tracking-wide">Line Items</h3>
              <button onClick={addItem} className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3">
                <Plus size={13} /> Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-600">
                    <th className="text-left text-dark-400 py-2 pr-2 min-w-[180px]">Description</th>
                    <th className="text-left text-dark-400 py-2 px-2 w-24">HSN/SAC</th>
                    <th className="text-right text-dark-400 py-2 px-2 w-20">Qty</th>
                    <th className="text-right text-dark-400 py-2 px-2 w-28">Unit Price</th>
                    <th className="text-right text-dark-400 py-2 px-2 w-20">GST%</th>
                    <th className="text-right text-dark-400 py-2 px-2 w-28">Amount</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="border-b border-dark-700/50">
                      <td className="py-1.5 pr-2">
                        <input
                          value={item.description}
                          onChange={e => updateItem(idx, 'description', e.target.value)}
                          placeholder="Service / Product description"
                          className="input-dark w-full text-sm"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          value={item.hsn}
                          onChange={e => updateItem(idx, 'hsn', e.target.value)}
                          placeholder="9983"
                          className="input-dark w-full text-sm font-mono"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          min={0}
                          value={item.quantity}
                          onChange={e => updateItem(idx, 'quantity', e.target.value)}
                          className="input-dark w-full text-sm text-right"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitPrice}
                          onChange={e => updateItem(idx, 'unitPrice', e.target.value)}
                          className="input-dark w-full text-sm text-right"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <Select
                          value={String(item.taxRate)}
                          onChange={v => updateItem(idx, 'taxRate', v)}
                          options={[
                            { value: '0',  label: '0%'  },
                            { value: '5',  label: '5%'  },
                            { value: '12', label: '12%' },
                            { value: '18', label: '18%' },
                            { value: '28', label: '28%' },
                          ]}
                          className="w-full"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-right font-semibold text-white">
                        {fmtAmt(item.amount)}
                      </td>
                      <td className="py-1.5 pl-2">
                        {lineItems.length > 1 && (
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-dark-500 hover:text-red-400 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals + extras */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Payment terms + notes */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-dark-400 mb-1">Payment Terms</label>
                <input
                  value={paymentTerms}
                  onChange={e => setPaymentTerms(e.target.value)}
                  placeholder="e.g. Net 30 days"
                  className="input-dark w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-dark-400 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Thank you for your business…"
                  className="input-dark w-full resize-none"
                />
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-dark-300">
                <span>Subtotal</span><span className="text-white">{fmtAmt(subtotal)}</span>
              </div>
              <div className="flex justify-between text-dark-300">
                <span>GST Amount</span><span className="text-white">{fmtAmt(taxAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-dark-300">
                <span>Discount (₹)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  className="input-dark w-28 text-right"
                />
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-dark-600">
                <span className="text-white">Total</span>
                <span className="text-blue-400">{fmtAmt(totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-dark-700">
            <button onClick={onClose} disabled={saving} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary min-w-[120px]">
              {saving ? 'Saving…' : isEdit ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

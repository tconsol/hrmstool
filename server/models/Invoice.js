const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true, trim: true },
  hsn:         { type: String, trim: true, default: '' },   // HSN/SAC code
  quantity:    { type: Number, required: true, min: 0 },
  unitPrice:   { type: Number, required: true, min: 0 },
  taxRate:     { type: Number, default: 18, min: 0, max: 100 }, // GST % (0,5,12,18,28)
  amount:      { type: Number, required: true, min: 0 },      // qty × unitPrice
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
    trim: true,
  },
  // outgoing = we issued the invoice (we provided services → get money)
  // incoming = we received the invoice (we took services → pay money)
  type: {
    type: String,
    enum: ['outgoing', 'incoming'],
    required: true,
  },
  invoiceDate: {
    type: Date,
    required: true,
  },
  dueDate: {
    type: Date,
  },
  // The other party (client for outgoing, vendor for incoming)
  party: {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, trim: true, lowercase: true, default: '' },
    phone:   { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    gstin:   { type: String, trim: true, uppercase: true, default: '' }, // their GST number
    pan:     { type: String, trim: true, uppercase: true, default: '' },
    state:   { type: String, trim: true, default: '' }, // for IGST vs CGST+SGST decision
  },
  lineItems:    { type: [lineItemSchema], required: true },
  subtotal:     { type: Number, required: true, min: 0 },  // sum of lineItem amounts
  taxAmount:    { type: Number, required: true, min: 0 },  // total GST amount
  discount:     { type: Number, default: 0, min: 0 },      // flat discount
  totalAmount:  { type: Number, required: true, min: 0 },  // subtotal + tax - discount
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
  },
  paymentTerms: { type: String, trim: true, default: '' },
  notes:        { type: String, trim: true, default: '' },
  paidAt:       { type: Date, default: null },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Unique invoice number per organization
invoiceSchema.index({ organization: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ organization: 1, type: 1, createdAt: -1 });
invoiceSchema.index({ organization: 1, status: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);

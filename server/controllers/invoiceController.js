const Invoice      = require('../models/Invoice');
const Organization = require('../models/Organization');
const { generateInvoicePDF } = require('../utils/generateInvoice');

// ── Auto-generate next invoice number: INV-YYYY-NNNN ──────────────
const generateInvoiceNumber = async (orgId, type) => {
  const prefix = type === 'incoming' ? 'PUR' : 'INV';
  const year   = new Date().getFullYear();
  const base   = `${prefix}-${year}-`;
  const last   = await Invoice.findOne(
    { organization: orgId, invoiceNumber: new RegExp(`^${base}`) },
    { invoiceNumber: 1 },
    { sort: { invoiceNumber: -1 } }
  );
  if (!last) return `${base}0001`;
  const num = parseInt(last.invoiceNumber.split('-').pop(), 10) || 0;
  return `${base}${String(num + 1).padStart(4, '0')}`;
};

// ── List invoices ────────────────────────────────────────────────
exports.getInvoices = async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20, search } = req.query;
    const query = { organization: req.orgId };
    if (type)   query.type   = type;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { invoiceNumber:  new RegExp(search, 'i') },
        { 'party.name':   new RegExp(search, 'i') },
      ];
    }

    const total    = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .populate('createdBy', 'name employeeId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ invoices, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

// ── Single invoice ───────────────────────────────────────────────
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, organization: req.orgId })
      .populate('createdBy', 'name employeeId');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

// ── Create ────────────────────────────────────────────────────────
exports.createInvoice = async (req, res) => {
  try {
    const { type, invoiceDate, dueDate, party, lineItems, discount = 0, notes, paymentTerms, status } = req.body;

    // Compute totals server-side for safety
    const subtotal = lineItems.reduce((sum, item) => {
      const amt = parseFloat(item.quantity) * parseFloat(item.unitPrice);
      item.amount = parseFloat(amt.toFixed(2));
      return sum + item.amount;
    }, 0);
    const taxAmount   = lineItems.reduce((sum, item) => sum + (item.amount * (item.taxRate || 0)) / 100, 0);
    const totalAmount = Math.max(0, subtotal + taxAmount - parseFloat(discount));

    const invoiceNumber = await generateInvoiceNumber(req.orgId, type);

    const invoice = await Invoice.create({
      organization:  req.orgId,
      invoiceNumber,
      type,
      invoiceDate:   invoiceDate  ? new Date(invoiceDate)  : new Date(),
      dueDate:       dueDate      ? new Date(dueDate)       : undefined,
      party,
      lineItems,
      subtotal:      parseFloat(subtotal.toFixed(2)),
      taxAmount:     parseFloat(taxAmount.toFixed(2)),
      discount:      parseFloat(parseFloat(discount).toFixed(2)),
      totalAmount:   parseFloat(totalAmount.toFixed(2)),
      notes,
      paymentTerms,
      status:        status || 'draft',
      createdBy:     req.user._id,
    });

    res.status(201).json(invoice);
  } catch (err) {    if (err.code === 11000) return res.status(400).json({ error: 'Invoice number already exists' });
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

// ── Update ────────────────────────────────────────────────────────
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, organization: req.orgId });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const { invoiceDate, dueDate, party, lineItems, discount = 0, notes, paymentTerms, status } = req.body;

    // Recompute totals
    const subtotal = lineItems.reduce((sum, item) => {
      const amt = parseFloat(item.quantity) * parseFloat(item.unitPrice);
      item.amount = parseFloat(amt.toFixed(2));
      return sum + item.amount;
    }, 0);
    const taxAmount   = lineItems.reduce((sum, item) => sum + (item.amount * (item.taxRate || 0)) / 100, 0);
    const totalAmount = Math.max(0, subtotal + taxAmount - parseFloat(discount));

    Object.assign(invoice, {
      invoiceDate:  invoiceDate ? new Date(invoiceDate) : invoice.invoiceDate,
      dueDate:      dueDate     ? new Date(dueDate)     : invoice.dueDate,
      party,
      lineItems,
      subtotal:     parseFloat(subtotal.toFixed(2)),
      taxAmount:    parseFloat(taxAmount.toFixed(2)),
      discount:     parseFloat(parseFloat(discount).toFixed(2)),
      totalAmount:  parseFloat(totalAmount.toFixed(2)),
      notes,
      paymentTerms,
      status:       status || invoice.status,
      paidAt:       status === 'paid' ? (invoice.paidAt || new Date()) : invoice.paidAt,
    });

    await invoice.save();
    res.json(invoice);
  } catch (err) {    res.status(500).json({ error: 'Failed to update invoice' });
  }
};

// ── Update status only ────────────────────────────────────────────
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      {
        status,
        ...(status === 'paid' ? { paidAt: new Date() } : {}),
      },
      { new: true }
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// ── Delete ────────────────────────────────────────────────────────
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, organization: req.orgId });
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
};

// ── Download PDF ──────────────────────────────────────────────────
exports.downloadPDF = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, organization: req.orgId })
      .populate('createdBy', 'name');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const org = await Organization.findById(req.orgId).select('name logo gstNumber address email phone');
    if (!org) return res.status(404).json({ error: 'Organization not found' });

    const pdfBuffer = await generateInvoicePDF(invoice.toObject(), org.toObject());

    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      'Content-Length':       pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (err) {    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

// ── Summary stats ─────────────────────────────────────────────────
exports.getSummary = async (req, res) => {
  try {
    const [outgoing, incoming] = await Promise.all([
      Invoice.aggregate([
        { $match: { organization: req.orgId, type: 'outgoing' } },
        { $group: {
          _id:   '$status',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' },
        }},
      ]),
      Invoice.aggregate([
        { $match: { organization: req.orgId, type: 'incoming' } },
        { $group: {
          _id:   '$status',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' },
        }},
      ]),
    ]);
    res.json({ outgoing, incoming });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
};

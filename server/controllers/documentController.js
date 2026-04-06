const Document = require('../models/Document');
const User = require('../models/User');
const { generateDocumentPDF } = require('../utils/generateDocument');
const { generateDocumentDocx } = require('../utils/generateDocumentDocx');
const { compressImage } = require('../utils/compressImage');

const DOCUMENT_TYPES = {
  offer_letter: 'Offer Letter',
  appointment_letter: 'Appointment Letter',
  experience_letter: 'Experience Letter',
  relieving_letter: 'Relieving Letter',
  increment_letter: 'Increment Letter',
  salary_structure: 'Salary Structure',
};

exports.createDocument = async (req, res) => {
  try {
    const { employee, type, data, companyName, companyAddress, companyLogo, status } = req.body;

    if (!employee || !type) {
      return res.status(400).json({ error: 'Employee and document type are required' });
    }

    if (!DOCUMENT_TYPES[type]) {
      return res.status(400).json({ error: 'Invalid document type' });
    }

    const emp = await User.findById(employee);
    if (!emp) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const title = `${DOCUMENT_TYPES[type]} - ${emp.name}`;

    // Auto-compress logo if it exceeds size limit
    let processedLogo = companyLogo;
    if (companyLogo) {
      try { processedLogo = await compressImage(companyLogo); } catch (e) { processedLogo = companyLogo; }
    }

    const document = new Document({
      employee,
      type,
      title,
      data: data || {},
      companyName,
      companyAddress,
      companyLogo: processedLogo,
      status: status || 'draft',
      generatedBy: req.user._id,
    });

    await document.save();
    const populated = await document.populate([
      { path: 'employee', select: 'name email employeeId department designation joiningDate address salary ctc' },
      { path: 'generatedBy', select: 'name' },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const { type, employee, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (type) query.type = type;
    if (employee) query.employee = employee;
    if (status) query.status = status;

    const total = await Document.countDocuments(query);
    const documents = await Document.find(query)
      .populate('employee', 'name email employeeId department designation')
      .populate('generatedBy', 'name')
      .select('-companyLogo')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      documents,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('employee', 'name email employeeId department designation joiningDate address salary ctc')
      .populate('generatedBy', 'name');

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch document' });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const { data, companyName, companyAddress, companyLogo, status } = req.body;

    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (data) document.data = data;
    if (companyName !== undefined) document.companyName = companyName;
    if (companyAddress !== undefined) document.companyAddress = companyAddress;
    if (companyLogo !== undefined) {
      try { document.companyLogo = await compressImage(companyLogo); } catch (e) { document.companyLogo = companyLogo; }
    }
    if (status) document.status = status;

    await document.save();
    const populated = await document.populate([
      { path: 'employee', select: 'name email employeeId department designation joiningDate address salary ctc' },
      { path: 'generatedBy', select: 'name' },
    ]);

    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update document' });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findByIdAndDelete(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('employee', 'name email employeeId department designation joiningDate address salary ctc');

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const pdfBuffer = await generateDocumentPDF(document);

    // Track download
    document.downloads.push({ format: 'pdf', downloadedBy: req.user._id });
    await document.save();

    const safeType = document.type.replace(/_/g, '-');
    const safeName = (document.employee?.name || 'document').replace(/\s+/g, '-');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${safeType}_${safeName}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Failed to generate document PDF' });
  }
};

exports.downloadDocx = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('employee', 'name email employeeId department designation joiningDate address salary ctc');

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const docxBuffer = await generateDocumentDocx(document);

    // Track download
    document.downloads.push({ format: 'docx', downloadedBy: req.user._id });
    await document.save();

    const safeType = document.type.replace(/_/g, '-');
    const safeName = (document.employee?.name || 'document').replace(/\s+/g, '-');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=${safeType}_${safeName}.docx`);
    res.send(docxBuffer);
  } catch (error) {
    console.error('Download DOCX error:', error);
    res.status(500).json({ error: 'Failed to generate Word document' });
  }
};

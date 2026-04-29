const Document = require('../models/Document');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { generateDocumentPDF } = require('../utils/generateDocument');
const { generateDocumentDocx } = require('../utils/generateDocumentDocx');
const { compressImage } = require('../utils/compressImage');
const { uploadFile, getSignedUrl, deleteFile } = require('../utils/gcpStorage');
const { generateAndUploadPDF, generateAndUploadDocx, cleanupOldDocuments } = require('../utils/generateDocumentGCS');

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

    const emp = await User.findOne({ _id: employee, organization: req.orgId })
      .populate('department', 'name')
      .populate('designation', 'name code');
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
      organization: req.orgId,
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
  } catch (error) {    res.status(500).json({ error: 'Failed to create document' });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const { type, employee, status, page = 1, limit = 20 } = req.query;
    const query = { organization: req.orgId };

    if (type) query.type = type;
    if (employee) query.employee = employee;
    if (status) query.status = status;

    const total = await Document.countDocuments(query);
    const documents = await Document.find(query)
      .populate('employee', 'name email employeeId department designation')
      .populate({
        path: 'employee',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'name code level' }
        ]
      })
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
    const document = await Document.findOne({ _id: req.params.id, organization: req.orgId })
      .populate('employee', 'name email employeeId department designation joiningDate address salary ctc')
      .populate({
        path: 'employee',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'name code level' }
        ]
      })
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

    const document = await Document.findOne({ _id: req.params.id, organization: req.orgId });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // If data changes, clean up cached PDFs/DOCXs so they'll be regenerated
    if (data && JSON.stringify(data) !== JSON.stringify(document.data)) {
      await cleanupOldDocuments(document);
      document.pdfFile = undefined;
      document.docxFile = undefined;
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
  } catch (error) {    res.status(500).json({ error: 'Failed to update document' });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, organization: req.orgId });
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Clean up generated documents from GCS
    await cleanupOldDocuments(document);

    // Delete the document record
    await Document.findByIdAndDelete(req.params.id);

    res.json({ message: 'Document deleted' });
  } catch (error) {    res.status(500).json({ error: 'Failed to delete document' });
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, organization: req.orgId })
      .populate({
        path: 'employee',
        select: 'name email employeeId department designation joiningDate address salary ctc',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'name code level' },
        ],
      });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Generate the PDF
    const pdfBuffer = await generateDocumentPDF(document);

    // Try to upload to GCS (non-blocking, best-effort)
    if (!document.pdfFile?.gcsPath) {
      try {
        const org = await Organization.findById(req.orgId).select('slug');
        if (org) {
          const uploadResult = await generateAndUploadPDF(
            document,
            org.slug,
            document.employee.employeeId,
            document.employee.name
          );
          document.pdfFile = {
            gcsPath: uploadResult.gcsPath,
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            generatedAt: new Date(),
          };
        }
      } catch (uploadErr) {
        // GCS not configured or upload failed — continue without caching      }
    }

    // Track download
    document.downloads.push({ format: 'pdf', downloadedBy: req.user._id });
    await document.save();

    const safeType = document.type.replace(/_/g, '-');
    const safeName = (document.employee?.name || 'document').replace(/\s+/g, '-');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${safeType}_${safeName}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {    res.status(500).json({ error: 'Failed to generate document PDF' });
  }
};

exports.downloadDocx = async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, organization: req.orgId })
      .populate({
        path: 'employee',
        select: 'name email employeeId department designation joiningDate address salary ctc',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'designation', select: 'name code level' },
        ],
      });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Generate the DOCX
    const docxBuffer = await generateDocumentDocx(document);

    // Try to upload to GCS (non-blocking, best-effort)
    if (!document.docxFile?.gcsPath) {
      try {
        const org = await Organization.findById(req.orgId).select('slug');
        if (org) {
          const uploadResult = await generateAndUploadDocx(
            document,
            org.slug,
            document.employee.employeeId,
            document.employee.name
          );
          document.docxFile = {
            gcsPath: uploadResult.gcsPath,
            fileName: uploadResult.fileName,
            fileSize: uploadResult.fileSize,
            generatedAt: new Date(),
          };
        }
      } catch (uploadErr) {
        // GCS not configured or upload failed — continue without caching      }
    }

    // Track download
    document.downloads.push({ format: 'docx', downloadedBy: req.user._id });
    await document.save();

    const safeType = document.type.replace(/_/g, '-');
    const safeName = (document.employee?.name || 'document').replace(/\s+/g, '-');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=${safeType}_${safeName}.docx`);
    res.send(docxBuffer);
  } catch (error) {    res.status(500).json({ error: 'Failed to generate Word document' });
  }
};

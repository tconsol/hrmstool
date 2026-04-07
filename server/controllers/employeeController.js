const { body } = require('express-validator');
const User = require('../models/User');
const Organization = require('../models/Organization');
const { generateEmployeeId } = require('./authController');
const { uploadFile, getSignedUrl, deleteFile, buildObjectPath, ALLOWED_MIME_TYPES, MAX_FILE_SIZE } = require('../utils/gcpStorage');

exports.addEmployeeValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
  body('department').optional().trim(),
  body('designation').optional().trim(),
  body('salary').optional().isNumeric().withMessage('Salary must be a number'),
  body('role').optional().isIn(['hr', 'manager', 'ceo', 'employee']).withMessage('Invalid role'),
];

exports.updateEmployeeValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().trim(),
  body('department').optional().trim(),
  body('designation').optional().trim(),
  body('salary').optional().isNumeric().withMessage('Salary must be a number'),
  body('role').optional().isIn(['hr', 'manager', 'ceo', 'employee']).withMessage('Invalid role'),
];

exports.getEmployees = async (req, res) => {
  try {
    const { search, department, status, role, page = 1, limit = 10 } = req.query;
    const query = { organization: req.orgId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }
    if (department) query.department = department;
    if (status) query.status = status;
    if (role) query.role = role;

    const total = await User.countDocuments(query);
    const employees = await User.find(query)
      .select('-password')
      .populate('department', 'name')
      .populate('designation', 'name code level')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      employees,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
};

exports.getEmployee = async (req, res) => {
  try {
    const employee = await User.findOne({ _id: req.params.id, organization: req.orgId })
      .select('-password')
      .populate('department', 'name code')
      .populate('designation', 'name code level description');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
};

exports.addEmployee = async (req, res) => {
  try {
    const { email } = req.body;

    const existing = await User.findOne({ email, organization: req.orgId });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const employeeId = await generateEmployeeId(req.orgId);

    const employee = new User({
      ...req.body,
      employeeId,
      organization: req.orgId,
    });

    await employee.save();
    res.status(201).json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add employee' });
  }
};

exports.updateEmployee = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.password; // Don't allow password update through this route

    const employee = await User.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      updates,
      { new: true, runValidators: true }
    ).select('-password')
      .populate('department', 'name code')
      .populate('designation', 'name code level');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update employee' });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const employee = await User.findOne({ _id: req.params.id, organization: req.orgId });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    employee.status = employee.status === 'active' ? 'inactive' : 'active';
    await employee.save();

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await User.distinct('department', { organization: req.orgId, department: { $ne: '' } });
    res.json(departments.filter(Boolean));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
};

// Whitelist of valid document keys to prevent injection
const VALID_DOC_KEYS = [
  'aadhaarCard', 'panCard', 'passport', 'voterId', 'drivingLicense',
  'addressProof', 'sscCertificate', 'hscCertificate', 'graduationDegree',
  'postGraduationDegree', 'otherCertifications', 'previousOfferLetter',
  'previousAppointmentLetter', 'salarySlips', 'relievingLetter',
  'experienceLetter', 'form16', 'bankPassbook', 'cancelledCheque',
  'pfForm11', 'uanCard', 'medicalCertificate', 'healthInsurance',
  'passportPhoto', 'signedOfferLetter', 'employmentAgreement',
  'ndaAgreement', 'codeOfConduct', 'itAssetAcknowledgment',
  'policeVerification', 'bgvConsent',
];

// Get employee onboarding documents (with signed URLs)
exports.getEmployeeDocuments = async (req, res) => {
  try {
    const employee = await User.findOne({ _id: req.params.id, organization: req.orgId })
      .select('name employeeId onboardingDocuments emergencyContact nomineeName nomineeRelationship bloodGroup fatherName dateOfBirth bankAccountNumber ifscCode bankName uan panNumber aadhaarNumber');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Generate signed URLs for each document that has a gcsPath
    const employeeObj = employee.toObject();
    if (employeeObj.onboardingDocuments) {
      const urlPromises = [];
      for (const [key, doc] of Object.entries(employeeObj.onboardingDocuments)) {
        if (doc && doc.gcsPath) {
          urlPromises.push(
            getSignedUrl(doc.gcsPath).then(url => {
              employeeObj.onboardingDocuments[key].url = url;
            }).catch(() => {
              employeeObj.onboardingDocuments[key].url = null;
            })
          );
        }
      }
      await Promise.all(urlPromises);
    }

    res.json(employeeObj);
  } catch (error) {
    console.error('Failed to fetch employee documents:', error);
    res.status(500).json({ error: 'Failed to fetch employee documents' });
  }
};

// Upload a single onboarding document to GCP Cloud Storage
exports.uploadEmployeeDocument = async (req, res) => {
  try {
    const { docKey } = req.body;

    // Validate docKey against whitelist
    if (!docKey || !VALID_DOC_KEYS.includes(docKey)) {
      return res.status(400).json({ error: 'Invalid document key' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Look up employee and organization
    const employee = await User.findOne({ _id: req.params.id, organization: req.orgId })
      .select('name employeeId onboardingDocuments');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const org = await Organization.findById(req.orgId).select('slug');
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Delete old file from GCS if replacing
    const existingDoc = employee.onboardingDocuments?.[docKey];
    if (existingDoc?.gcsPath) {
      await deleteFile(existingDoc.gcsPath).catch(err => {
        console.error(`Failed to delete old file for ${docKey}:`, err);
      });
    }

    // Build path and upload to GCS
    const gcsPath = buildObjectPath(
      org.slug,
      employee.employeeId,
      employee.name,
      docKey,
      req.file.originalname
    );

    await uploadFile(gcsPath, req.file.buffer, req.file.mimetype);

    // Update database
    const updateData = {
      [`onboardingDocuments.${docKey}`]: {
        gcsPath,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedAt: new Date(),
      },
    };

    const updated = await User.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      { $set: updateData },
      { new: true }
    ).select('name employeeId onboardingDocuments');

    // Return signed URL for the uploaded file
    const signedUrl = await getSignedUrl(gcsPath);

    res.json({
      docKey,
      fileName: req.file.originalname,
      url: signedUrl,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to upload document:', error);
    res.status(500).json({ error: error.message || 'Failed to upload document' });
  }
};

// Update employee personal details (no file upload)
exports.updateEmployeePersonalDetails = async (req, res) => {
  try {
    const { emergencyContact, nomineeName, nomineeRelationship, bloodGroup, fatherName, dateOfBirth, bankAccountNumber, ifscCode, bankName, uan, panNumber, aadhaarNumber } = req.body;

    const updateData = {};
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
    if (nomineeName !== undefined) updateData.nomineeName = nomineeName;
    if (nomineeRelationship !== undefined) updateData.nomineeRelationship = nomineeRelationship;
    if (bloodGroup !== undefined) updateData.bloodGroup = bloodGroup;
    if (fatherName !== undefined) updateData.fatherName = fatherName;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth;
    if (bankAccountNumber !== undefined) updateData.bankAccountNumber = bankAccountNumber;
    if (ifscCode !== undefined) updateData.ifscCode = ifscCode;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (uan !== undefined) updateData.uan = uan;
    if (panNumber !== undefined) updateData.panNumber = panNumber;
    if (aadhaarNumber !== undefined) updateData.aadhaarNumber = aadhaarNumber;

    const employee = await User.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      { $set: updateData },
      { new: true }
    ).select('name employeeId emergencyContact nomineeName nomineeRelationship bloodGroup fatherName dateOfBirth bankAccountNumber ifscCode bankName uan panNumber aadhaarNumber');

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Failed to update personal details:', error);
    res.status(500).json({ error: 'Failed to update personal details' });
  }
};

// Remove a specific onboarding document (delete from GCS + DB)
exports.removeEmployeeDocument = async (req, res) => {
  try {
    const { docKey } = req.params;

    // Validate docKey against whitelist
    if (!VALID_DOC_KEYS.includes(docKey)) {
      return res.status(400).json({ error: 'Invalid document key' });
    }

    // Get current document info to delete from GCS
    const employee = await User.findOne({ _id: req.params.id, organization: req.orgId })
      .select('onboardingDocuments');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Delete from GCS
    const existingDoc = employee.onboardingDocuments?.[docKey];
    if (existingDoc?.gcsPath) {
      await deleteFile(existingDoc.gcsPath).catch(err => {
        console.error(`Failed to delete file from GCS for ${docKey}:`, err);
      });
    }

    // Remove from database
    const updated = await User.findOneAndUpdate(
      { _id: req.params.id, organization: req.orgId },
      { $unset: { [`onboardingDocuments.${docKey}`]: '' } },
      { new: true }
    ).select('name employeeId onboardingDocuments');

    res.json(updated);
  } catch (error) {
    console.error('Failed to remove document:', error);
    res.status(500).json({ error: 'Failed to remove document' });
  }
};

// Self-service: Employee uploads their own profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get employee (user is authenticated and req.user contains the logged-in user)
    const employee = await User.findById(req.user.id).select('name employeeId profilePicture');
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const org = await Organization.findById(req.user.organization).select('slug');
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Delete old profile picture from GCS if exists
    if (employee.profilePicture?.gcsPath) {
      await deleteFile(employee.profilePicture.gcsPath).catch(err => {
        console.error('Failed to delete old profile picture:', err);
      });
    }

    // Build path: {orgSlug}/profile/{employeeId}_{employeeName}/profile.{ext}
    const gcsPath = `${org.slug}/profile/${employee.employeeId}_${employee.name.replace(/\s+/g, '_')}/profile_${Date.now()}${require('path').extname(req.file.originalname).toLowerCase()}`;

    // Upload to GCS
    await uploadFile(gcsPath, req.file.buffer, req.file.mimetype);

    // Update database
    const updated = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          profilePicture: {
            gcsPath,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            uploadedAt: new Date(),
          },
        },
      },
      { new: true }
    ).select('name employeeId profilePicture');

    // Return signed URL for the profile picture
    const signedUrl = await getSignedUrl(gcsPath);

    res.json({
      profilePicture: {
        gcsPath,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size,
        url: signedUrl,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to upload profile picture:', error);
    res.status(500).json({ error: error.message || 'Failed to upload profile picture' });
  }
};

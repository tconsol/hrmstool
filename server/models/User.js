const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  employeeId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  phone: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['hr', 'manager', 'ceo', 'employee'],
    default: 'employee',
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null,
  },
  designation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Designation',
    default: null,
  },
  salary: {
    type: Number,
    default: 0,
  },
  ctc: {
    annualCTC: { type: Number, default: 0 },
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    specialAllowance: { type: Number, default: 0 },
    conveyanceAllowance: { type: Number, default: 0 },
    medicalAllowance: { type: Number, default: 0 },
    lta: { type: Number, default: 0 },
    epfEmployer: { type: Number, default: 0 },
    gratuity: { type: Number, default: 0 },
    insurance: { type: Number, default: 0 },
    variablePay: { type: Number, default: 0 },
    foodCoupons: { type: Number, default: 0 },
    transportAllowance: { type: Number, default: 0 },
    internetReimbursement: { type: Number, default: 0 },
  },
  joiningDate: {
    type: Date,
    default: Date.now,
  },
  address: {
    type: String,
    trim: true,
  },
  profilePicture: {
    gcsPath: String,
    fileName: String,
    mimeType: String,
    fileSize: Number,
    uploadedAt: Date,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  leaveBalance: {
    casual: { type: Number, default: 12 },
    sick: { type: Number, default: 12 },
    paid: { type: Number, default: 15 },
  },
  // Onboarding Documents (stored in GCP Cloud Storage)
  onboardingDocuments: {
    // Identity Proof
    aadhaarCard: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    panCard: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    passport: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    voterId: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    drivingLicense: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    // Address Proof
    addressProof: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    // Educational Documents
    sscCertificate: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    hscCertificate: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    graduationDegree: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    postGraduationDegree: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    otherCertifications: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    // Previous Employment
    previousOfferLetter: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    previousAppointmentLetter: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    salarySlips: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    relievingLetter: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    experienceLetter: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    form16: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    // Bank Details
    bankPassbook: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    cancelledCheque: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    // Tax & Statutory
    pfForm11: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    uanCard: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    // Medical & Insurance
    medicalCertificate: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    healthInsurance: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    // Photographs
    passportPhoto: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    // Company-Specific
    signedOfferLetter: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    employmentAgreement: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    ndaAgreement: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    codeOfConduct: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    itAssetAcknowledgment: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    // Additional
    policeVerification: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
    bgvConsent: { gcsPath: String, fileName: String, mimeType: String, fileSize: Number, uploadedAt: Date },
  },
  // Emergency & Personal Details
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relationship: { type: String, default: '' },
  },
  nomineeName: { type: String, default: '' },
  nomineeRelationship: { type: String, default: '' },
  bloodGroup: { type: String, default: '' },
  fatherName: { type: String, default: '' },
  dateOfBirth: { type: Date },
  bankAccountNumber: { type: String, default: '' },
  ifscCode: { type: String, default: '' },
  bankName: { type: String, default: '' },
  uan: { type: String, default: '' },
  panNumber: { type: String, default: '' },
  aadhaarNumber: { type: String, default: '' },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

userSchema.index({ organization: 1, email: 1 }, { unique: true });
userSchema.index({ organization: 1, employeeId: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);

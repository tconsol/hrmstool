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
  avatar: {
    type: String,
    default: '',
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

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const superAdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
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
  avatar: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    default: 'superadmin',
    immutable: true,
  },
  permissions: {
    manageOrganizations: { type: Boolean, default: true },
    manageSubscriptions: { type: Boolean, default: true },
    viewRevenue: { type: Boolean, default: true },
    manageSystemSettings: { type: Boolean, default: true },
    viewAuditLogs: { type: Boolean, default: true },
    manageSuperAdmins: { type: Boolean, default: true },
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  lastLogin: {
    type: Date,
  },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
}, {
  timestamps: true,
});

superAdminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

superAdminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

superAdminSchema.methods.toJSON = function () {
  const admin = this.toObject();
  delete admin.password;
  return admin;
};

module.exports = mongoose.model('SuperAdmin', superAdminSchema);

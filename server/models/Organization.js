const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  logo: {
    type: String, // base64 data URL
    default: '',
  },
  website: {
    type: String,
    trim: true,
  },
  industry: {
    type: String,
    trim: true,
  },
  employeeCount: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    default: '1-10',
  },
  subscription: {
    plan: { type: String, enum: ['free', 'starter', 'professional', 'enterprise'], default: 'free' },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    maxEmployees: { type: Number, default: 25 },
  },
  settings: {
    fiscalYearStart: { type: Number, default: 4 }, // April
    workingDays: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    shiftStartTime: { type: String, default: '09:00' },
    shiftEndTime: { type: String, default: '18:00' },
    lateThresholdMinutes: { type: Number, default: 30 },
    currency: { type: String, default: 'INR' },
    dateFormat: { type: String, default: 'DD/MM/YYYY' },
    leavePolicy: {
      casual: { type: Number, default: 12 },
      sick: { type: Number, default: 12 },
      paid: { type: Number, default: 15 },
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Organization', organizationSchema);

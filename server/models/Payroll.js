const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
    required: true,
  },
  baseSalary: {
    type: Number,
    required: true,
  },
  deductions: {
    leave: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  bonuses: {
    performance: { type: Number, default: 0 },
    festival: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
  },
  totalDeductions: {
    type: Number,
    default: 0,
  },
  totalBonuses: {
    type: Number,
    default: 0,
  },
  netSalary: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'hold'],
    default: 'pending',
  },
  paymentDate: {
    type: Date,
    default: null,
  },
  payslipPath: {
    type: String,
    default: '',
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// One payroll per user per month
payrollSchema.index({ organization: 1, user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);

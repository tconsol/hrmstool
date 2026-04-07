const mongoose = require('mongoose');

const designationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    trim: true,
    uppercase: true,
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  level: {
    type: String,
    enum: ['entry', 'junior', 'senior', 'lead', 'manager', 'executive'],
    default: 'entry',
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

designationSchema.index({ organization: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Designation', designationSchema);

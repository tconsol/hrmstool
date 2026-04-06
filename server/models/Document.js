const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'offer_letter',
      'appointment_letter',
      'experience_letter',
      'relieving_letter',
      'increment_letter',
      'salary_structure',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  companyName: {
    type: String,
    trim: true,
  },
  companyAddress: {
    type: String,
    trim: true,
  },
  companyLogo: {
    type: String, // base64 data URL
  },
  status: {
    type: String,
    enum: ['draft', 'final'],
    default: 'draft',
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  downloads: [{
    format: { type: String, enum: ['pdf', 'docx'], required: true },
    downloadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    downloadedAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

documentSchema.index({ employee: 1, type: 1 });
documentSchema.index({ generatedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);

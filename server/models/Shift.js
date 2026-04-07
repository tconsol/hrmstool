const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  startTime: {
    type: String, // "09:00"
    required: true,
  },
  endTime: {
    type: String, // "18:00"
    required: true,
  },
  graceMinutes: {
    type: Number,
    default: 30,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
}, {
  timestamps: true,
});

shiftSchema.index({ organization: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Shift', shiftSchema);

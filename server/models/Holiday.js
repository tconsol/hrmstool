const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    enum: ['national', 'company', 'optional'],
    default: 'company',
  },
  description: {
    type: String,
    trim: true,
    default: '',
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
}, {
  timestamps: true,
});

holidaySchema.index({ organization: 1, date: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);

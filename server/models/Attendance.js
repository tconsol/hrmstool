const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  checkIn: {
    type: Date,
    default: null,
  },
  checkOut: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    default: 'present',
  },
  workHours: {
    type: Number,
    default: 0,
  },
  notes: {
    type: String,
    trim: true,
  },
  markedBy: {
    type: String,
    enum: ['self', 'hr'],
    default: 'self',
  },
}, {
  timestamps: true,
});

// Compound index: one record per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);

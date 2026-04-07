const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['laptop', 'phone', 'monitor', 'keyboard', 'mouse', 'headset', 'chair', 'desk', 'id_card', 'other'],
    required: true,
  },
  brand: {
    type: String,
    trim: true,
  },
  model: {
    type: String,
    trim: true,
  },
  serialNumber: {
    type: String,
    trim: true,
  },
  purchaseDate: {
    type: Date,
  },
  purchaseCost: {
    type: Number,
    default: 0,
  },
  warrantyExpiry: {
    type: Date,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  assignedDate: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    enum: ['available', 'assigned', 'maintenance', 'retired'],
    default: 'available',
  },
  notes: {
    type: String,
    trim: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
}, {
  timestamps: true,
});

assetSchema.index({ organization: 1, status: 1 });
assetSchema.index({ organization: 1, assignedTo: 1 });

module.exports = mongoose.model('Asset', assetSchema);

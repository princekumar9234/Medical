const mongoose = require('mongoose');

const medicineScanHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    barcode: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      default: null,
    },
    medicineName: {
      type: String,
      trim: true,
      default: 'Unknown Medicine',
    },
    brandName: {
      type: String,
      trim: true,
    },
    genericName: {
      type: String,
      trim: true,
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    source: {
      type: String,
      default: 'Manual/Scanner',
    },
    found: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const MedicineScanHistory = mongoose.model('MedicineScanHistory', medicineScanHistorySchema);
module.exports = MedicineScanHistory;

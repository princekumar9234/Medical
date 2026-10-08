const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      trim: true,
    },
    brandName: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      required: [true, 'Generic name is required'],
      trim: true,
      index: true,
    },
    activeIngredients: [{ type: String, trim: true }],
    strength: {
      type: String,
      trim: true,
    },
    dosageForm: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    manufacturer: {
      type: String,
      required: [true, 'Manufacturer is required'],
      trim: true,
    },
    barcode: {
      type: String,
      required: [true, 'Barcode is required'],
      unique: true,
      trim: true,
      index: true,
    },
    prescriptionRequired: {
      type: Boolean,
      default: false,
    },
    indications: [{ type: String, trim: true }],
    clinicalUses: [{ type: String, trim: true }],
    dosage: {
      type: String,
      trim: true,
    },
    warnings: [{ type: String, trim: true }],
    precautions: [{ type: String, trim: true }],
    contraindications: [{ type: String, trim: true }],
    sideEffects: [{ type: String, trim: true }],
    storage: {
      type: String,
      trim: true,
    },
    drugInteractions: [{ type: String, trim: true }],
    source: {
      type: String,
      default: 'MediQ Verified Drug DB',
    },
    lastUpdatedDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

medicineSchema.index({ brandName: 'text', genericName: 'text', category: 'text' });

const Medicine = mongoose.model('Medicine', medicineSchema);
module.exports = Medicine;

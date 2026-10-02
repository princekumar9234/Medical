const mongoose = require('mongoose');

const medicineSearchSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    searchType: {
      type: String,
      enum: ['barcode', 'image', 'name'],
      default: 'name',
    },
    query: { type: String, trim: true },
    imageUrl: { type: String },
    barcodeValue: { type: String, trim: true },
    // Result
    productName: { type: String, trim: true },
    manufacturer: { type: String, trim: true },
    category: { type: String, trim: true },
    activeIngredients: [{ type: String }],
    usageInfo: { type: String },
    warnings: [{ type: String }],
    generalInfo: { type: String },
    source: { type: String },
    found: { type: Boolean, default: false },
    rawApiResponse: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

medicineSearchSchema.index({ patient: 1, createdAt: -1 });

const MedicineSearch = mongoose.model('MedicineSearch', medicineSearchSchema);
module.exports = MedicineSearch;

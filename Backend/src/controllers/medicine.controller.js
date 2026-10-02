const MedicineSearch = require('../models/MedicineSearch');
const { searchByName, searchByBarcode } = require('../services/medicine.service');
const { successResponse, errorResponse } = require('../utils/response');
const path = require('path');
const fs = require('fs');

// ─────────────────────────────────────────────
// SEARCH BY NAME
// ─────────────────────────────────────────────
const searchByNameController = async (req, res, next) => {
  try {
    const { name } = req.query;
    if (!name || name.trim().length < 2) {
      return errorResponse(res, 'Please enter a medicine/product name (at least 2 characters).', 400);
    }

    const result = await searchByName(name.trim());
    const found = !!result;

    const record = await MedicineSearch.create({
      patient: req.user._id,
      searchType: 'name',
      query: name.trim(),
      ...(found ? result : {}),
      found,
    });

    return successResponse(res, found ? 'Product found.' : 'No reliable information found for this product.', {
      ...record.toObject(),
      disclaimer:
        'This information is for educational purposes only. Consult a qualified healthcare professional before taking or changing any medication.',
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// SEARCH BY BARCODE
// ─────────────────────────────────────────────
const searchByBarcodeController = async (req, res, next) => {
  try {
    const { barcode } = req.query;
    if (!barcode) return errorResponse(res, 'Barcode is required.', 400);

    const result = await searchByBarcode(barcode.trim());
    const found = !!result;

    const record = await MedicineSearch.create({
      patient: req.user._id,
      searchType: 'barcode',
      barcodeValue: barcode.trim(),
      ...(found ? result : {}),
      found,
    });

    return successResponse(res, found ? 'Product found.' : 'No product found for this barcode.', {
      ...record.toObject(),
      disclaimer:
        'This information is for educational purposes only. Consult a qualified healthcare professional before taking or changing any medication.',
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// UPLOAD IMAGE (Store + return placeholder)
// ─────────────────────────────────────────────
const uploadMedicineImage = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'No image uploaded.', 400);
    const imageUrl = `uploads/medicines/${req.file.filename}`;

    const record = await MedicineSearch.create({
      patient: req.user._id,
      searchType: 'image',
      imageUrl,
      found: false,
      productName: 'Image uploaded — manual review required',
      generalInfo:
        'Automatic image-based identification is not yet supported. Please use the name or barcode search for product information.',
    });

    return successResponse(res, 'Image uploaded. Please use name or barcode search for detailed information.', {
      ...record.toObject(),
      disclaimer:
        'This information is for educational purposes only. Consult a qualified healthcare professional before taking or changing any medication.',
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET SEARCH HISTORY
// ─────────────────────────────────────────────
const getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const total = await MedicineSearch.countDocuments({ patient: req.user._id });
    const history = await MedicineSearch.find({ patient: req.user._id })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return successResponse(res, 'History fetched.', {
      history,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// DELETE HISTORY ENTRY
// ─────────────────────────────────────────────
const deleteHistoryEntry = async (req, res, next) => {
  try {
    const { historyId } = req.params;
    const entry = await MedicineSearch.findOneAndDelete({
      _id: historyId,
      patient: req.user._id,
    });

    if (!entry) return errorResponse(res, 'History entry not found.', 404);

    // Delete image if present
    if (entry.imageUrl) {
      const imgPath = path.join(__dirname, '../../', entry.imageUrl);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }

    return successResponse(res, 'History entry deleted.', null);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  searchByNameController,
  searchByBarcodeController,
  uploadMedicineImage,
  getHistory,
  deleteHistoryEntry,
};

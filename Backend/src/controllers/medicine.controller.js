const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const MedicineScanHistory = require('../models/MedicineScanHistory');
const { searchByBarcode, searchByName, getAllMedicines } = require('../services/medicine.service');
const { successResponse, errorResponse } = require('../utils/response');

const DISCLAIMER_TEXT =
  'Information shown is for educational purposes only. Always consult a qualified healthcare professional before using or changing medication.';

// ─────────────────────────────────────────────
// SEARCH BY BARCODE (POST & GET /api/medicines/barcode)
// ─────────────────────────────────────────────
const searchByBarcodeController = async (req, res, next) => {
  try {
    const rawBarcode = req.body?.barcode || req.query?.barcode;
    const barcode = String(rawBarcode || '').trim();

    if (!barcode) {
      return errorResponse(res, 'Barcode is required. Please provide a valid barcode number.', 400);
    }

    // Sanitize barcode (allow alphanumeric and hyphens, typically 4-30 chars)
    if (!/^[A-Za-z0-9\-_]{3,30}$/.test(barcode)) {
      return errorResponse(res, 'Invalid barcode format. Please check the code and try again.', 400);
    }

    const medicine = await searchByBarcode(barcode);
    const found = !!medicine;

    // Save to user scan history if authenticated
    if (req.user) {
      try {
        await MedicineScanHistory.create({
          userId: req.user._id,
          barcode,
          medicineId: medicine?._id || null,
          medicineName: medicine?.medicineName || medicine?.brandName || 'Unrecognized Product',
          brandName: medicine?.brandName || 'Unknown',
          genericName: medicine?.genericName || 'Unknown',
          manufacturer: medicine?.manufacturer || 'Unknown',
          scannedAt: new Date(),
          source: medicine?.source || 'Barcode Scanner',
          found,
        });
      } catch (historyErr) {
        console.error('Failed to log scan history:', historyErr.message);
      }
    }

    if (!found) {
      return res.status(200).json({
        success: true,
        found: false,
        message: 'Medicine information not found',
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      found: true,
      data: {
        medicine,
        disclaimer: DISCLAIMER_TEXT,
      },
      message: 'Medicine information retrieved successfully.',
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// SEARCH BY NAME (GET /api/medicines/search)
// ─────────────────────────────────────────────
const searchByNameController = async (req, res, next) => {
  try {
    const { name } = req.query;
    if (!name || name.trim().length < 2) {
      return errorResponse(res, 'Please enter a search query of at least 2 characters.', 400);
    }

    const medicines = await searchByName(name.trim());
    return successResponse(res, `Found ${medicines.length} medicine(s).`, {
      medicines,
      disclaimer: DISCLAIMER_TEXT,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET ALL MEDICINES (GET /api/medicines)
// ─────────────────────────────────────────────
const getAllMedicinesController = async (req, res, next) => {
  try {
    const medicines = await getAllMedicines();
    return successResponse(res, 'Verified medicines fetched successfully.', {
      medicines,
      disclaimer: DISCLAIMER_TEXT,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// CREATE SCAN HISTORY ENTRY (POST /api/medicines/scan-history)
// ─────────────────────────────────────────────
const createScanHistory = async (req, res, next) => {
  try {
    const { barcode, medicineId, medicineName, brandName, genericName, manufacturer, source, found } = req.body;

    if (!barcode) {
      return errorResponse(res, 'Barcode is required to record scan history.', 400);
    }

    const validMedicineId =
      medicineId && mongoose.isValidObjectId(medicineId) ? medicineId : null;

    const entry = await MedicineScanHistory.create({
      userId: req.user._id, // Enforce authenticated user's ID
      barcode: String(barcode).trim(),
      medicineId: validMedicineId,
      medicineName: medicineName || brandName || 'Unrecognized Product',
      brandName: brandName || 'Unknown',
      genericName: genericName || 'Unknown',
      manufacturer: manufacturer || 'Unknown',
      scannedAt: new Date(),
      source: source || 'Scanner',
      found: found !== undefined ? Boolean(found) : true,
    });

    return successResponse(res, 'Scan history saved successfully.', { history: entry }, 201);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET USER SCAN HISTORY (GET /api/medicines/scan-history)
// ─────────────────────────────────────────────
const getScanHistory = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Number(limit);

    const filter = { userId: req.user._id };

    const total = await MedicineScanHistory.countDocuments(filter);
    const history = await MedicineScanHistory.find(filter)
      .sort({ scannedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('medicineId');

    return successResponse(res, 'Scan history fetched successfully.', {
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
// GET SCAN HISTORY BY ID (GET /api/medicines/scan-history/:id)
// ─────────────────────────────────────────────
const getScanHistoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return errorResponse(res, 'Invalid history entry ID.', 400);
    }

    // Only allow the owner of the scan history to access it
    const entry = await MedicineScanHistory.findOne({
      _id: id,
      userId: req.user._id,
    }).populate('medicineId');

    if (!entry) {
      return errorResponse(res, 'Scan history entry not found or access denied.', 404);
    }

    return successResponse(res, 'Scan history entry details retrieved.', {
      history: entry,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// DELETE SCAN HISTORY ENTRY (DELETE /api/medicines/scan-history/:id)
// ─────────────────────────────────────────────
const deleteScanHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return errorResponse(res, 'Invalid history entry ID.', 400);
    }

    const entry = await MedicineScanHistory.findOneAndDelete({
      _id: id,
      userId: req.user._id, // Enforce tenant isolation
    });

    if (!entry) {
      return errorResponse(res, 'Scan history entry not found or access denied.', 404);
    }

    return successResponse(res, 'Scan history entry deleted successfully.', null);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  searchByBarcodeController,
  searchByNameController,
  getAllMedicinesController,
  createScanHistory,
  getScanHistory,
  getScanHistoryById,
  deleteScanHistory,
};

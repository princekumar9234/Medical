const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const {
  searchByBarcodeController,
  searchByNameController,
  getAllMedicinesController,
  createScanHistory,
  getScanHistory,
  getScanHistoryById,
  deleteScanHistory,
} = require('../controllers/medicine.controller');

// Protected medicine routes — requires authentication
router.get('/', protect, getAllMedicinesController);
router.get('/search', protect, searchByNameController);
router.post('/barcode', protect, searchByBarcodeController);
router.get('/barcode', protect, searchByBarcodeController);

// Authenticated Patient Scan History routes
router.post('/scan-history', protect, createScanHistory);
router.get('/scan-history', protect, getScanHistory);
router.get('/scan-history/:id', protect, getScanHistoryById);
router.delete('/scan-history/:id', protect, deleteScanHistory);

module.exports = router;

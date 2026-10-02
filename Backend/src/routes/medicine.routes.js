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

// Public / Guest accessible (attaches user if authenticated)
router.get('/', getAllMedicinesController);
router.get('/search', searchByNameController);
router.post('/barcode', optionalAuth, searchByBarcodeController);
router.get('/barcode', optionalAuth, searchByBarcodeController);

// Authenticated Patient Scan History routes
router.post('/scan-history', protect, createScanHistory);
router.get('/scan-history', protect, getScanHistory);
router.get('/scan-history/:id', protect, getScanHistoryById);
router.delete('/scan-history/:id', protect, deleteScanHistory);

module.exports = router;

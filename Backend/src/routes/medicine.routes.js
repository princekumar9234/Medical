const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { uploadMedicineImage: uploadMiddleware } = require('../config/multer');
const {
  searchByNameController, searchByBarcodeController,
  uploadMedicineImage, getHistory, deleteHistoryEntry,
} = require('../controllers/medicine.controller');

router.use(protect, authorize('patient'));

router.get('/search', searchByNameController);
router.get('/barcode', searchByBarcodeController);
router.post('/image', uploadMiddleware.single('image'), uploadMedicineImage);
router.get('/history', getHistory);
router.delete('/history/:historyId', deleteHistoryEntry);

module.exports = router;

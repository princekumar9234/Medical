const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { uploadProfilePhoto: uploadMiddleware } = require('../config/multer');
const {
  getMyProfile, updateMyProfile, uploadProfilePhoto,
  toggleSaveDoctor, getSavedDoctors,
} = require('../controllers/patient.controller');

router.use(protect, authorize('patient'));

router.get('/me/profile', getMyProfile);
router.put('/me/profile', updateMyProfile);
router.post('/me/photo', uploadMiddleware.single('photo'), uploadProfilePhoto);
router.get('/me/saved-doctors', getSavedDoctors);
router.post('/me/saved-doctors/:doctorId', toggleSaveDoctor);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware');
const { protect, authorize } = require('../middleware/auth.middleware');
const { uploadProfilePhoto: uploadMiddleware } = require('../config/multer');
const {
  getMyProfile, updateMyProfile, uploadProfilePhoto,
  getPublicProfile, searchDoctors,
  addExperience, updateExperience, deleteExperience,
  addEducation, updateEducation, deleteEducation,
  addWorkplace, getMyWorkplaces, updateWorkplace, deleteWorkplace,
  getAvailableSlots,
} = require('../controllers/doctor.controller');

// Public routes
router.get('/search', searchDoctors);
router.get('/:doctorId/profile', getPublicProfile);
router.get('/:doctorId/slots', getAvailableSlots);

// Protected doctor-only routes
router.use(protect, authorize('doctor'));

router.get('/me/profile', getMyProfile);
router.put('/me/profile', updateMyProfile);
router.post('/me/photo', uploadMiddleware.single('photo'), uploadProfilePhoto);

// Experience
router.post('/me/experience', [
  body('hospital').notEmpty().withMessage('Hospital name is required.'),
  body('position').notEmpty().withMessage('Position is required.'),
  body('startYear').isInt({ min: 1950, max: new Date().getFullYear() }).withMessage('Valid start year required.'),
], validate, addExperience);
router.put('/me/experience/:expId', updateExperience);
router.delete('/me/experience/:expId', deleteExperience);

// Education
router.post('/me/education', [
  body('degree').notEmpty().withMessage('Degree is required.'),
  body('institution').notEmpty().withMessage('Institution is required.'),
], validate, addEducation);
router.put('/me/education/:eduId', updateEducation);
router.delete('/me/education/:eduId', deleteEducation);

// Workplaces
router.post('/me/workplaces', [
  body('hospitalName').notEmpty().withMessage('Hospital name is required.'),
], validate, addWorkplace);
router.get('/me/workplaces', getMyWorkplaces);
router.put('/me/workplaces/:workplaceId', updateWorkplace);
router.delete('/me/workplaces/:workplaceId', deleteWorkplace);

module.exports = router;

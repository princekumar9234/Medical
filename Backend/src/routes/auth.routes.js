const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const {
  register, verifyEmail, resendVerificationEmail, login,
  logoutAll, forgotPassword, resetPassword, getMe, changePassword,
} = require('../controllers/auth.controller');

// Password validator
const strongPassword = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
  .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
  .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter.')
  .matches(/[0-9]/).withMessage('Password must contain at least one number.')
  .matches(/[@$!%*?&#]/).withMessage('Password must contain at least one special character (@$!%*?&#).');

// POST /api/auth/register
router.post(
  '/register',
  (req, res, next) => {
    // Normalize fields from frontend requests
    if (!req.body.fullName && req.body.name) {
      req.body.fullName = req.body.name;
    }
    if (req.body.role) {
      req.body.role = req.body.role.toLowerCase();
    }
    if (!req.body.confirmPassword && req.body.password) {
      req.body.confirmPassword = req.body.password;
    }
    if (typeof req.body.phone === 'string' && !req.body.phone.trim()) {
      delete req.body.phone;
    }
    next();
  },
  [
    body('fullName').trim().notEmpty().withMessage('Full name is required.').isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters.'),
    body('email').isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
    body('phone').optional({ checkFalsy: true }).matches(/^[6-9]\d{9}$/).withMessage('Please enter a valid 10-digit phone number.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('confirmPassword').optional().custom((value, { req }) => {
      if (value && value !== req.body.password) throw new Error('Passwords do not match.');
      return true;
    }),
    body('role').isIn(['doctor', 'patient']).withMessage('Role must be doctor or patient.'),
    body('specialization').if(body('role').equals('doctor')).optional().notEmpty().withMessage('Specialization is required for doctors.'),
  ],
  validate,
  register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  login
);

// GET /api/auth/verify-email and /api/auth/verify-email/:token
router.get('/verify-email', verifyEmail);
router.get('/verify-email/:token', verifyEmail);

// POST /api/auth/resend-verification
router.post(
  '/resend-verification',
  [body('email').isEmail().withMessage('Please enter a valid email.').normalizeEmail()],
  validate,
  resendVerificationEmail
);

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Please enter a valid email.').normalizeEmail()],
  validate,
  forgotPassword
);

// POST /api/auth/reset-password/:token
router.post(
  '/reset-password/:token',
  [
    strongPassword,
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) throw new Error('Passwords do not match.');
      return true;
    }),
  ],
  validate,
  resetPassword
);

// GET /api/auth/me — protected
router.get('/me', protect, getMe);

// POST /api/auth/logout-all — protected
router.post('/logout-all', protect, logoutAll);

// PUT /api/auth/change-password — protected
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    strongPassword,
  ],
  validate,
  changePassword
);

module.exports = router;

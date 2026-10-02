const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate.middleware');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  bookAppointment, getMyAppointments, getAppointmentById,
  updateAppointmentStatus, cancelAppointment, getTodayAppointments,
} = require('../controllers/appointment.controller');

router.use(protect);

// Patient — book
router.post(
  '/',
  authorize('patient'),
  [
    body('doctorId').notEmpty().withMessage('Doctor ID is required.'),
    body('date').isISO8601().withMessage('Valid date is required.'),
    body('timeSlot').notEmpty().withMessage('Time slot is required.'),
    body('reason').optional().isLength({ max: 500 }).withMessage('Reason too long.'),
  ],
  validate,
  bookAppointment
);

// Both — get my appointments
router.get('/', getMyAppointments);

// Doctor — today
router.get('/today', authorize('doctor'), getTodayAppointments);

// Both — single appointment
router.get('/:appointmentId', getAppointmentById);

// Doctor — update status
router.put(
  '/:appointmentId/status',
  authorize('doctor'),
  [
    body('status')
      .isIn(['confirmed', 'rejected', 'completed', 'cancelled'])
      .withMessage('Invalid status.'),
  ],
  validate,
  updateAppointmentStatus
);

// Patient — cancel
router.put('/:appointmentId/cancel', authorize('patient'), cancelAppointment);

module.exports = router;

const Appointment = require('../models/Appointment');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const { successResponse, errorResponse } = require('../utils/response');
const { createNotification } = require('../services/notification.service');

// ─────────────────────────────────────────────
// BOOK APPOINTMENT (Patient)
// ─────────────────────────────────────────────
const bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, date, timeSlot, reason } = req.body;

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) return errorResponse(res, 'Doctor not found.', 404);

    // Check for double booking
    const existing = await Appointment.findOne({
      doctor: doctorId,
      date: new Date(date),
      timeSlot,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (existing) return errorResponse(res, 'This time slot is already booked. Please choose another.', 409);

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date: new Date(date),
      timeSlot,
      reason,
    });

    // Notify doctor
    await createNotification({
      recipient: doctorId,
      sender: req.user._id,
      type: 'appointment_request',
      title: 'New Appointment Request',
      message: `${req.user.fullName} has requested an appointment on ${new Date(date).toDateString()} at ${timeSlot}.`,
      data: { appointmentId: appointment._id },
    });

    return successResponse(res, 'Appointment booked successfully.', appointment, 201);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET MY APPOINTMENTS
// ─────────────────────────────────────────────
const getMyAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const isDoctor = req.user.role === 'doctor';

    const filter = isDoctor
      ? { doctor: req.user._id }
      : { patient: req.user._id };

    if (status) filter.status = status;

    const total = await Appointment.countDocuments(filter);
    const appointments = await Appointment.find(filter)
      .populate(isDoctor ? 'patient' : 'doctor', 'fullName profilePhoto email phone')
      .sort({ date: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return successResponse(res, 'Appointments fetched.', {
      appointments,
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
// GET SINGLE APPOINTMENT
// ─────────────────────────────────────────────
const getAppointmentById = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId)
      .populate('patient', 'fullName profilePhoto email phone')
      .populate('doctor', 'fullName profilePhoto email phone');

    if (!appointment) return errorResponse(res, 'Appointment not found.', 404);

    // Ensure only the patient or doctor can view
    const isOwner =
      appointment.patient._id.toString() === req.user._id.toString() ||
      appointment.doctor._id.toString() === req.user._id.toString();

    if (!isOwner) return errorResponse(res, 'Unauthorized.', 403);

    return successResponse(res, 'Appointment fetched.', appointment);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// UPDATE APPOINTMENT STATUS (Doctor)
// ─────────────────────────────────────────────
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { status, doctorNotes, cancelReason } = req.body;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctor: req.user._id,
    });

    if (!appointment) return errorResponse(res, 'Appointment not found.', 404);

    const allowedTransitions = {
      pending: ['confirmed', 'rejected'],
      confirmed: ['completed', 'cancelled'],
    };

    if (!allowedTransitions[appointment.status]?.includes(status)) {
      return errorResponse(
        res,
        `Cannot transition from '${appointment.status}' to '${status}'.`,
        400
      );
    }

    appointment.status = status;
    if (doctorNotes) appointment.doctorNotes = doctorNotes;
    if (cancelReason) {
      appointment.cancelReason = cancelReason;
      appointment.cancelledBy = 'doctor';
    }
    await appointment.save();

    // Notify patient
    const notifMap = {
      confirmed: { type: 'appointment_confirmed', title: 'Appointment Confirmed', msg: `Your appointment on ${appointment.date.toDateString()} at ${appointment.timeSlot} has been confirmed.` },
      rejected: { type: 'appointment_rejected', title: 'Appointment Rejected', msg: `Your appointment request has been rejected.` },
      cancelled: { type: 'appointment_cancelled', title: 'Appointment Cancelled', msg: `Your appointment has been cancelled by the doctor.` },
      completed: { type: 'appointment_completed', title: 'Appointment Completed', msg: `Your appointment has been marked as completed.` },
    };

    if (notifMap[status]) {
      await createNotification({
        recipient: appointment.patient,
        sender: req.user._id,
        type: notifMap[status].type,
        title: notifMap[status].title,
        message: notifMap[status].msg,
        data: { appointmentId: appointment._id },
      });
    }

    return successResponse(res, `Appointment ${status}.`, appointment);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// CANCEL APPOINTMENT (Patient)
// ─────────────────────────────────────────────
const cancelAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { cancelReason } = req.body;

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: req.user._id,
    });

    if (!appointment) return errorResponse(res, 'Appointment not found.', 404);

    if (!['pending', 'confirmed'].includes(appointment.status)) {
      return errorResponse(res, 'This appointment cannot be cancelled.', 400);
    }

    appointment.status = 'cancelled';
    appointment.cancelledBy = 'patient';
    appointment.cancelReason = cancelReason || 'Cancelled by patient';
    await appointment.save();

    // Notify doctor
    await createNotification({
      recipient: appointment.doctor,
      sender: req.user._id,
      type: 'appointment_cancelled',
      title: 'Appointment Cancelled',
      message: `${req.user.fullName} has cancelled the appointment on ${appointment.date.toDateString()} at ${appointment.timeSlot}.`,
      data: { appointmentId: appointment._id },
    });

    return successResponse(res, 'Appointment cancelled.', appointment);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET TODAY'S APPOINTMENTS (Doctor Dashboard)
// ─────────────────────────────────────────────
const getTodayAppointments = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await Appointment.find({
      doctor: req.user._id,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['pending', 'confirmed'] },
    })
      .populate('patient', 'fullName profilePhoto')
      .sort('timeSlot');

    return successResponse(res, "Today's appointments fetched.", appointments);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  bookAppointment,
  getMyAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  getTodayAppointments,
};

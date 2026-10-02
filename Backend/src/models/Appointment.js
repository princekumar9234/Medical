const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    timeSlot: {
      type: String,
      required: true, // "10:00 AM"
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
      index: true,
    },
    doctorNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Doctor notes cannot exceed 1000 characters'],
    },
    cancelledBy: {
      type: String,
      enum: ['doctor', 'patient', null],
      default: null,
    },
    cancelReason: { type: String, trim: true },
  },
  { timestamps: true }
);

// Compound index to prevent double booking
appointmentSchema.index(
  { doctor: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'confirmed'] },
    },
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;

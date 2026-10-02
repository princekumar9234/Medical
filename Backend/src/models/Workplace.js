const mongoose = require('mongoose');

const workplaceSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    hospitalName: { type: String, required: true, trim: true },
    department: { type: String, trim: true },
    position: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true, index: true },
    state: { type: String, trim: true },
    contactNumber: { type: String, trim: true },
    workingDays: [
      {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      },
    ],
    workingHoursStart: { type: String }, // "09:00"
    workingHoursEnd: { type: String },   // "18:00"
    isPublic: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Workplace = mongoose.model('Workplace', workplaceSchema);
module.exports = Workplace;

const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  hospital: { type: String, required: true, trim: true },
  position: { type: String, required: true, trim: true },
  department: { type: String, trim: true },
  startYear: { type: Number, required: true },
  endYear: { type: Number, default: null }, // null = Present
  isCurrent: { type: Boolean, default: false },
  location: { type: String, trim: true },
  description: { type: String, trim: true },
  order: { type: Number, default: 0 },
});

const educationSchema = new mongoose.Schema({
  degree: { type: String, required: true, trim: true },
  institution: { type: String, required: true, trim: true },
  year: { type: Number },
  description: { type: String, trim: true },
  order: { type: Number, default: 0 },
});

const certificationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  issuedBy: { type: String, trim: true },
  year: { type: Number },
  credentialId: { type: String, trim: true },
});

const availabilitySlotSchema = new mongoose.Schema({
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "17:00"
  slotDuration: { type: Number, default: 30 }, // minutes
});

const doctorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    qualifications: {
      type: String,
      required: true,
      trim: true,
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0,
    },
    about: {
      type: String,
      trim: true,
      maxlength: [2000, 'About section cannot exceed 2000 characters'],
    },
    consultationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    languages: [{ type: String, trim: true }],
    services: [{ type: String, trim: true }],
    registrationNumber: {
      type: String,
      trim: true,
    },
    experience: [experienceSchema],
    education: [educationSchema],
    certifications: [certificationSchema],
    availability: [availabilitySlotSchema],
    // Contact visibility settings
    showPhone: { type: Boolean, default: false },
    showEmail: { type: Boolean, default: true },
    // Social / Professional links
    linkedIn: { type: String, trim: true },
    website: { type: String, trim: true },
    // Profile completion score
    profileCompletionScore: { type: Number, default: 0 },
    // For search / filter
    city: { type: String, trim: true, index: true },
    isProfilePublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text index for searching
doctorProfileSchema.index({
  specialization: 'text',
  city: 'text',
  qualifications: 'text',
});

const DoctorProfile = mongoose.model('DoctorProfile', doctorProfileSchema);
module.exports = DoctorProfile;

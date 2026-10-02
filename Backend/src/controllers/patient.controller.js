const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const { successResponse, errorResponse } = require('../utils/response');
const path = require('path');
const fs = require('fs');

// ─────────────────────────────────────────────
// GET MY PROFILE
// ─────────────────────────────────────────────
const getMyProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const profile = await PatientProfile.findOne({ user: req.user._id }).populate(
      'savedDoctors',
      'fullName profilePhoto'
    );
    return successResponse(res, 'Profile fetched.', { user, profile });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// UPDATE MY PROFILE
// ─────────────────────────────────────────────
const updateMyProfile = async (req, res, next) => {
  try {
    const {
      fullName, phone,
      dateOfBirth, age, gender, bloodGroup,
      address, city, state,
      emergencyContactName, emergencyContactPhone,
      allergies, chronicConditions, currentMedications,
    } = req.body;

    await User.findByIdAndUpdate(req.user._id, {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
    });

    const profile = await PatientProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        ...(dateOfBirth !== undefined && { dateOfBirth }),
        ...(age !== undefined && { age: Number(age) }),
        ...(gender && { gender }),
        ...(bloodGroup && { bloodGroup }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(emergencyContactName !== undefined && { emergencyContactName }),
        ...(emergencyContactPhone !== undefined && { emergencyContactPhone }),
        ...(allergies && { allergies: Array.isArray(allergies) ? allergies : allergies.split(',').map(a => a.trim()) }),
        ...(chronicConditions && { chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : chronicConditions.split(',').map(a => a.trim()) }),
        ...(currentMedications && { currentMedications: Array.isArray(currentMedications) ? currentMedications : currentMedications.split(',').map(a => a.trim()) }),
      },
      { new: true, runValidators: true }
    );

    return successResponse(res, 'Profile updated.', profile);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// UPLOAD PROFILE PHOTO
// ─────────────────────────────────────────────
const uploadProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 'No file uploaded.', 400);

    const user = await User.findById(req.user._id);
    if (user.profilePhoto) {
      const oldPath = path.join(__dirname, '../../', user.profilePhoto);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const photoUrl = `uploads/profiles/${req.file.filename}`;
    user.profilePhoto = photoUrl;
    await user.save();

    return successResponse(res, 'Profile photo updated.', { profilePhoto: photoUrl });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// SAVE / UNSAVE DOCTOR
// ─────────────────────────────────────────────
const toggleSaveDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) return errorResponse(res, 'Doctor not found.', 404);

    const profile = await PatientProfile.findOne({ user: req.user._id });
    const isSaved = profile.savedDoctors.includes(doctorId);

    if (isSaved) {
      profile.savedDoctors = profile.savedDoctors.filter((id) => id.toString() !== doctorId);
    } else {
      profile.savedDoctors.push(doctorId);
    }

    await profile.save();

    return successResponse(res, isSaved ? 'Doctor removed from saved.' : 'Doctor saved.', {
      isSaved: !isSaved,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET SAVED DOCTORS
// ─────────────────────────────────────────────
const getSavedDoctors = async (req, res, next) => {
  try {
    const profile = await PatientProfile.findOne({ user: req.user._id }).populate(
      'savedDoctors',
      'fullName profilePhoto email'
    );

    if (!profile) return successResponse(res, 'No saved doctors.', { savedDoctors: [] });

    const DoctorProfile = require('../models/DoctorProfile');
    const savedWithDetails = await Promise.all(
      profile.savedDoctors.map(async (doctor) => {
        const dp = await DoctorProfile.findOne({ user: doctor._id }).select(
          'specialization yearsOfExperience consultationFee city'
        );
        return {
          doctorId: doctor._id,
          fullName: doctor.fullName,
          profilePhoto: doctor.profilePhoto,
          specialization: dp?.specialization || '',
          yearsOfExperience: dp?.yearsOfExperience || 0,
          consultationFee: dp?.consultationFee || 0,
          city: dp?.city || '',
        };
      })
    );

    return successResponse(res, 'Saved doctors fetched.', { savedDoctors: savedWithDetails });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  toggleSaveDoctor,
  getSavedDoctors,
};

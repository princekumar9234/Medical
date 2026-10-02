const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const Workplace = require('../models/Workplace');
const { successResponse, errorResponse } = require('../utils/response');
const path = require('path');
const fs = require('fs');

// ─────────────────────────────────────────────
// GET MY DOCTOR PROFILE
// ─────────────────────────────────────────────
const getMyProfile = async (req, res, next) => {
  try {
    const profile = await DoctorProfile.findOne({ user: req.user._id });
    const user = await User.findById(req.user._id);

    if (!profile) return errorResponse(res, 'Doctor profile not found.', 404);

    return successResponse(res, 'Profile fetched.', { user, profile });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// UPDATE MY DOCTOR PROFILE
// ─────────────────────────────────────────────
const updateMyProfile = async (req, res, next) => {
  try {
    const {
      fullName, phone,
      specialization, qualifications, yearsOfExperience, about,
      consultationFee, languages, services, registrationNumber,
      city, showPhone, showEmail, linkedIn, website, availability,
    } = req.body;

    // Update User fields
    await User.findByIdAndUpdate(req.user._id, {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
    });

    // Update DoctorProfile fields
    const profile = await DoctorProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        ...(specialization && { specialization }),
        ...(qualifications && { qualifications }),
        ...(yearsOfExperience !== undefined && { yearsOfExperience: Number(yearsOfExperience) }),
        ...(about !== undefined && { about }),
        ...(consultationFee !== undefined && { consultationFee: Number(consultationFee) }),
        ...(languages && { languages: Array.isArray(languages) ? languages : languages.split(',').map((l) => l.trim()) }),
        ...(services && { services: Array.isArray(services) ? services : services.split(',').map((s) => s.trim()) }),
        ...(registrationNumber !== undefined && { registrationNumber }),
        ...(city !== undefined && { city }),
        ...(showPhone !== undefined && { showPhone: showPhone === 'true' || showPhone === true }),
        ...(showEmail !== undefined && { showEmail: showEmail === 'true' || showEmail === true }),
        ...(linkedIn !== undefined && { linkedIn }),
        ...(website !== undefined && { website }),
        ...(availability && { availability: JSON.parse(typeof availability === 'string' ? availability : JSON.stringify(availability)) }),
      },
      { new: true, runValidators: true }
    );

    return successResponse(res, 'Profile updated successfully.', profile);
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

    // Delete old photo
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
// GET PUBLIC DOCTOR PROFILE
// ─────────────────────────────────────────────
const getPublicProfile = async (req, res, next) => {
  try {
    const { doctorId } = req.params;

    const user = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!user) return errorResponse(res, 'Doctor not found.', 404);

    const profile = await DoctorProfile.findOne({ user: doctorId });
    if (!profile || !profile.isProfilePublic)
      return errorResponse(res, 'This doctor profile is not publicly available.', 404);

    const workplaces = await Workplace.find({ doctor: doctorId, isPublic: true });

    return successResponse(res, 'Doctor profile fetched.', {
      user: {
        id: user._id,
        fullName: user.fullName,
        profilePhoto: user.profilePhoto,
        email: profile.showEmail ? user.email : null,
        phone: profile.showPhone ? user.phone : null,
      },
      profile,
      workplaces,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// SEARCH DOCTORS
// ─────────────────────────────────────────────
const searchDoctors = async (req, res, next) => {
  try {
    const {
      name, specialization, city, minExperience, maxFee, page = 1, limit = 12,
    } = req.query;

    const profileFilter = { isProfilePublic: true };

    if (specialization) {
      profileFilter.specialization = { $regex: specialization, $options: 'i' };
    }
    if (city) {
      profileFilter.city = { $regex: city, $options: 'i' };
    }
    if (minExperience) {
      profileFilter.yearsOfExperience = { $gte: Number(minExperience) };
    }
    if (maxFee) {
      profileFilter.consultationFee = { ...profileFilter.consultationFee, $lte: Number(maxFee) };
    }

    let doctorProfiles = await DoctorProfile.find(profileFilter)
      .populate('user', 'fullName profilePhoto email')
      .lean();

    // Filter by doctor name if provided
    if (name) {
      doctorProfiles = doctorProfiles.filter((p) =>
        p.user?.fullName?.toLowerCase().includes(name.toLowerCase())
      );
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    const total = doctorProfiles.length;
    const paginated = doctorProfiles.slice(skip, skip + Number(limit));

    // Get workplaces for each doctor
    const doctorIds = paginated.map((p) => p.user?._id);
    const workplaces = await Workplace.find({ doctor: { $in: doctorIds }, isPublic: true });

    const results = paginated.map((profile) => {
      const doctorWorkplace = workplaces.find(
        (w) => w.doctor.toString() === profile.user?._id?.toString()
      );
      return {
        doctorId: profile.user?._id,
        fullName: profile.user?.fullName,
        profilePhoto: profile.user?.profilePhoto,
        specialization: profile.specialization,
        qualifications: profile.qualifications,
        yearsOfExperience: profile.yearsOfExperience,
        consultationFee: profile.consultationFee,
        city: profile.city,
        hospital: doctorWorkplace?.hospitalName || null,
        availability: profile.availability?.length > 0,
        languages: profile.languages,
      };
    });

    return successResponse(res, 'Doctors fetched.', {
      results,
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
// EXPERIENCE CRUD
// ─────────────────────────────────────────────
const addExperience = async (req, res, next) => {
  try {
    const profile = await DoctorProfile.findOne({ user: req.user._id });
    if (!profile) return errorResponse(res, 'Profile not found.', 404);

    profile.experience.push(req.body);
    await profile.save();

    return successResponse(res, 'Experience added.', profile.experience, 201);
  } catch (err) {
    next(err);
  }
};

const updateExperience = async (req, res, next) => {
  try {
    const { expId } = req.params;
    const profile = await DoctorProfile.findOne({ user: req.user._id });
    if (!profile) return errorResponse(res, 'Profile not found.', 404);

    const exp = profile.experience.id(expId);
    if (!exp) return errorResponse(res, 'Experience not found.', 404);

    Object.assign(exp, req.body);
    await profile.save();

    return successResponse(res, 'Experience updated.', profile.experience);
  } catch (err) {
    next(err);
  }
};

const deleteExperience = async (req, res, next) => {
  try {
    const { expId } = req.params;
    const profile = await DoctorProfile.findOne({ user: req.user._id });
    if (!profile) return errorResponse(res, 'Profile not found.', 404);

    profile.experience = profile.experience.filter((e) => e._id.toString() !== expId);
    await profile.save();

    return successResponse(res, 'Experience deleted.', profile.experience);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// EDUCATION CRUD
// ─────────────────────────────────────────────
const addEducation = async (req, res, next) => {
  try {
    const profile = await DoctorProfile.findOne({ user: req.user._id });
    if (!profile) return errorResponse(res, 'Profile not found.', 404);
    profile.education.push(req.body);
    await profile.save();
    return successResponse(res, 'Education added.', profile.education, 201);
  } catch (err) {
    next(err);
  }
};

const updateEducation = async (req, res, next) => {
  try {
    const { eduId } = req.params;
    const profile = await DoctorProfile.findOne({ user: req.user._id });
    if (!profile) return errorResponse(res, 'Profile not found.', 404);
    const edu = profile.education.id(eduId);
    if (!edu) return errorResponse(res, 'Education entry not found.', 404);
    Object.assign(edu, req.body);
    await profile.save();
    return successResponse(res, 'Education updated.', profile.education);
  } catch (err) {
    next(err);
  }
};

const deleteEducation = async (req, res, next) => {
  try {
    const { eduId } = req.params;
    const profile = await DoctorProfile.findOne({ user: req.user._id });
    if (!profile) return errorResponse(res, 'Profile not found.', 404);
    profile.education = profile.education.filter((e) => e._id.toString() !== eduId);
    await profile.save();
    return successResponse(res, 'Education deleted.', profile.education);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// WORKPLACE CRUD
// ─────────────────────────────────────────────
const addWorkplace = async (req, res, next) => {
  try {
    const workplace = await Workplace.create({ ...req.body, doctor: req.user._id });
    return successResponse(res, 'Workplace added.', workplace, 201);
  } catch (err) {
    next(err);
  }
};

const getMyWorkplaces = async (req, res, next) => {
  try {
    const workplaces = await Workplace.find({ doctor: req.user._id }).sort('order');
    return successResponse(res, 'Workplaces fetched.', workplaces);
  } catch (err) {
    next(err);
  }
};

const updateWorkplace = async (req, res, next) => {
  try {
    const { workplaceId } = req.params;
    const workplace = await Workplace.findOneAndUpdate(
      { _id: workplaceId, doctor: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!workplace) return errorResponse(res, 'Workplace not found.', 404);
    return successResponse(res, 'Workplace updated.', workplace);
  } catch (err) {
    next(err);
  }
};

const deleteWorkplace = async (req, res, next) => {
  try {
    const { workplaceId } = req.params;
    const workplace = await Workplace.findOneAndDelete({ _id: workplaceId, doctor: req.user._id });
    if (!workplace) return errorResponse(res, 'Workplace not found.', 404);
    return successResponse(res, 'Workplace deleted.', null);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET AVAILABLE SLOTS FOR A DOCTOR ON A DATE
// ─────────────────────────────────────────────
const getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) return errorResponse(res, 'Date is required.', 400);

    const profile = await DoctorProfile.findOne({ user: doctorId });
    if (!profile) return errorResponse(res, 'Doctor not found.', 404);

    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const dayAvailability = profile.availability.filter((a) => a.day === dayName);

    if (!dayAvailability.length) {
      return successResponse(res, 'No availability on this day.', { slots: [] });
    }

    // Generate time slots
    const Appointment = require('../models/Appointment');
    const existingAppointments = await Appointment.find({
      doctor: doctorId,
      date: new Date(date),
      status: { $in: ['pending', 'confirmed'] },
    }).select('timeSlot');

    const bookedSlots = existingAppointments.map((a) => a.timeSlot);
    const allSlots = [];

    dayAvailability.forEach((slot) => {
      const [startH, startM] = slot.startTime.split(':').map(Number);
      const [endH, endM] = slot.endTime.split(':').map(Number);
      const duration = slot.slotDuration || 30;

      let current = startH * 60 + startM;
      const end = endH * 60 + endM;

      while (current + duration <= end) {
        const hour = Math.floor(current / 60);
        const min = current % 60;
        const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        allSlots.push({
          time: timeStr,
          available: !bookedSlots.includes(timeStr),
        });
        current += duration;
      }
    });

    return successResponse(res, 'Available slots fetched.', { slots: allSlots, dayName });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  getPublicProfile,
  searchDoctors,
  addExperience, updateExperience, deleteExperience,
  addEducation, updateEducation, deleteEducation,
  addWorkplace, getMyWorkplaces, updateWorkplace, deleteWorkplace,
  getAvailableSlots,
};

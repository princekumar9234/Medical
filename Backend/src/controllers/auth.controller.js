const crypto = require('crypto');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const PatientProfile = require('../models/PatientProfile');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/email.service');

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      phone,
      password,
      role,
      specialization,
      qualification,
      dateOfBirth,
      gender,
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'An account with this email already exists.', 409);
    }

    // Create user
    const user = new User({ fullName, email, phone, password, role });
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Create role-specific profile
    if (role === 'doctor') {
      await DoctorProfile.create({
        user: user._id,
        specialization: specialization || 'General Medicine',
        qualifications: qualification || '',
      });
    } else {
      await PatientProfile.create({
        user: user._id,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
      });
    }

    // Send verification email (don't fail registration if email fails)
    try {
      await sendVerificationEmail(email, fullName, verificationToken);
    } catch (emailErr) {
      console.error('Email send failed:', emailErr.message);
    }

    return successResponse(
      res,
      'Registration successful! Please check your email to verify your account.',
      { email, role },
      201
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// VERIFY EMAIL
// ─────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return errorResponse(res, 'Email verification link is invalid or has expired.', 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return successResponse(res, 'Email verified successfully! You can now log in.', null, 200);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// RESEND VERIFICATION EMAIL
// ─────────────────────────────────────────────
const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select(
      '+emailVerificationToken +emailVerificationExpires'
    );

    if (!user) {
      return errorResponse(res, 'No account found with this email.', 404);
    }

    if (user.isEmailVerified) {
      return errorResponse(res, 'This email is already verified.', 400);
    }

    const token = user.generateEmailVerificationToken();
    await user.save();

    await sendVerificationEmail(email, user.fullName, token);

    return successResponse(res, 'Verification email sent. Please check your inbox.', null, 200);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +tokenVersion');
    if (!user) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Your account has been deactivated. Please contact support.', 403);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.role, user.tokenVersion);

    return successResponse(res, 'Login successful.', {
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// LOGOUT FROM ALL DEVICES
// ─────────────────────────────────────────────
const logoutAll = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
    return successResponse(res, 'Logged out from all devices successfully.', null);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Always return success to prevent email enumeration
    if (!user) {
      return successResponse(
        res,
        'If an account with this email exists, a password reset link has been sent.',
        null
      );
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    try {
      await sendPasswordResetEmail(email, user.fullName, resetToken);
    } catch (emailErr) {
      console.error('Password reset email failed:', emailErr.message);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      return errorResponse(res, 'Failed to send reset email. Please try again.', 500);
    }

    return successResponse(
      res,
      'If an account with this email exists, a password reset link has been sent.',
      null
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires +tokenVersion');

    if (!user) {
      return errorResponse(res, 'Password reset link is invalid or has expired.', 400);
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.tokenVersion += 1; // Invalidate all existing sessions
    await user.save();

    return successResponse(res, 'Password reset successfully. Please log in with your new password.', null);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// GET CURRENT USER (me)
// ─────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    return successResponse(res, 'User fetched successfully.', {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePhoto: user.profilePhoto,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect.', 400);
    }

    user.password = newPassword;
    await user.save();

    return successResponse(res, 'Password changed successfully.', null);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  logoutAll,
  forgotPassword,
  resetPassword,
  getMe,
  changePassword,
};

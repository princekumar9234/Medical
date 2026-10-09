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
      name,
      email,
      phone,
      password,
      role,
      specialization,
      qualification,
      qualifications,
      licenseNumber,
      consultationFee,
      experienceYears,
      hospitalAffiliation,
      dateOfBirth,
      gender,
    } = req.body;

    const actualFullName = (fullName || name || '').trim();
    const actualRole = (role || 'patient').toLowerCase();

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'An account with this email already exists.', 409);
    }

    // Clean phone
    const cleanPhone = phone && phone.trim() ? phone.trim() : undefined;

    // Create user
    const user = new User({
      fullName: actualFullName,
      email,
      phone: cleanPhone,
      password,
      role: actualRole,
    });
    const { token: verificationToken, otp: verificationOtp } = user.generateEmailVerificationToken();
    await user.save();

    // Create role-specific profile
    if (actualRole === 'doctor') {
      await DoctorProfile.create({
        user: user._id,
        specialization: specialization || 'General Medicine',
        qualifications: qualification || qualifications || 'MBBS / Medical Degree',
        yearsOfExperience: Number(experienceYears) || 0,
        consultationFee: Number(consultationFee) || 500,
        registrationNumber: licenseNumber || `REG-${Math.floor(100000 + Math.random() * 900000)}`,
        experience: hospitalAffiliation
          ? [{ hospital: hospitalAffiliation, position: 'Practicing Physician', startYear: 2020, isCurrent: true }]
          : [],
      });
    } else {
      await PatientProfile.create({
        user: user._id,
        dateOfBirth: dateOfBirth || null,
        gender: gender || 'Other',
      });
    }

    // Send verification email in background (OTP + link) without blocking HTTP response
    sendVerificationEmail(email, actualFullName, verificationToken, verificationOtp).catch((emailErr) => {
      console.error('[Register] Background email send failed:', emailErr.message);
    });

    return successResponse(
      res,
      'Registration successful! A verification link has been sent to your email. Please verify your email before logging in.',
      {
        requiresEmailVerification: true,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isEmailVerified: false,
          profilePhoto: user.profilePhoto,
        },
      },
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
    // Accept token from path param or query string, and clean it
    const rawToken = req.params.token || req.query.token;
    const queryEmail = req.query.email ? decodeURIComponent(req.query.email).trim().toLowerCase() : null;
    const queryOtp = req.query.otp || req.body?.otp;

    // ── OTP-based verification path ───────────────────────────────────
    if (queryOtp && queryEmail) {
      const userByEmail = await User.findOne({ email: queryEmail }).select(
        '+emailVerificationOtp +emailVerificationExpires'
      );

      if (!userByEmail) {
        return errorResponse(res, 'No account found with this email address.', 404);
      }

      if (userByEmail.isEmailVerified) {
        return successResponse(res, 'Email is already verified! You can now log in.', {
          user: {
            id: userByEmail._id,
            fullName: userByEmail.fullName,
            email: userByEmail.email,
            role: userByEmail.role,
            isEmailVerified: true,
          },
        }, 200);
      }

      console.log(`[OTP Debug] Email: ${queryEmail}`);
      console.log(`[OTP Debug] Stored OTP: "${userByEmail.emailVerificationOtp}"`);
      console.log(`[OTP Debug] Submitted OTP: "${String(queryOtp).trim()}"`);
      console.log(`[OTP Debug] Match: ${userByEmail.emailVerificationOtp === String(queryOtp).trim()}`);
      console.log(`[OTP Debug] Expires: ${userByEmail.emailVerificationExpires}`);

      if (!userByEmail.emailVerificationOtp || userByEmail.emailVerificationOtp !== String(queryOtp).trim()) {
        return errorResponse(res, 'Invalid verification code. Please check your email and try again.', 400);
      }


      if (userByEmail.emailVerificationExpires && userByEmail.emailVerificationExpires < Date.now()) {
        return errorResponse(res, 'Verification code has expired. Please request a new one.', 400);
      }

      userByEmail.isEmailVerified = true;
      userByEmail.emailVerificationOtp = undefined;
      userByEmail.emailVerificationToken = undefined;
      userByEmail.emailVerificationExpires = undefined;
      await userByEmail.save();

      console.log(`[verifyEmail] OTP verified email for user: ${userByEmail.email}`);
      return successResponse(res, 'Email verified successfully! You can now log in.', {
        user: {
          id: userByEmail._id,
          fullName: userByEmail.fullName,
          email: userByEmail.email,
          role: userByEmail.role,
          isEmailVerified: true,
        },
      }, 200);
    }

    if (!rawToken) {
      if (queryEmail) {
        const existing = await User.findOne({ email: queryEmail });
        if (existing && existing.isEmailVerified) {
          return successResponse(
            res,
            'Email is already verified! You can now log in.',
            {
              user: {
                id: existing._id,
                fullName: existing.fullName,
                email: existing.email,
                role: existing.role,
                isEmailVerified: true,
              },
            },
            200
          );
        }
      }
      return errorResponse(res, 'Email verification token is missing.', 400);
    }

    // Decode and trim to handle any URL encoding or whitespace issues
    const token = decodeURIComponent(rawToken).trim();
    console.log(`[verifyEmail] Verifying token (prefix: ${token.substring(0, 10)}..., len=${token.length})`);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 1. Look for user with this verification token
    let user = await User.findOne({
      emailVerificationToken: hashedToken,
    }).select('+emailVerificationToken +emailVerificationExpires');

    // 2. If not found by token, check if user with queryEmail is already verified
    if (!user && queryEmail) {
      const existingUser = await User.findOne({ email: queryEmail });
      if (existingUser && existingUser.isEmailVerified) {
        console.log(`[verifyEmail] User ${existingUser.email} already verified (found via queryEmail).`);
        return successResponse(
          res,
          'Email is already verified! You can now log in.',
          {
            user: {
              id: existingUser._id,
              fullName: existingUser.fullName,
              email: existingUser.email,
              role: existingUser.role,
              isEmailVerified: true,
            },
          },
          200
        );
      }
    }

    if (!user) {
      console.log(`[verifyEmail] No user found for hashed token: ${hashedToken.substring(0, 12)}...`);
      return errorResponse(
        res,
        'Email verification link is invalid or has expired. Please use the Resend button to get a new link.',
        400
      );
    }

    // 3. User found by token — if already verified, return success
    if (user.isEmailVerified) {
      console.log(`[verifyEmail] User ${user.email} is already verified.`);
      return successResponse(
        res,
        'Email is already verified! You can now log in.',
        {
          user: {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isEmailVerified: true,
          },
        },
        200
      );
    }

    // Check expiration
    if (user.emailVerificationExpires && user.emailVerificationExpires < Date.now()) {
      return errorResponse(
        res,
        'Email verification link has expired. Please use the Resend button to get a new link.',
        400
      );
    }

    user.isEmailVerified = true;
    // Note: Keep emailVerificationToken so duplicate calls (e.g. React StrictMode, double clicks, page refresh)
    // within the expiry period won't fail with a false "invalid link" error! It will be cleared once user logs in.
    await user.save();

    console.log(`[verifyEmail] Successfully verified email for user: ${user.email}`);

    return successResponse(
      res,
      'Email verified successfully! You can now log in.',
      {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isEmailVerified: true,
        },
      },
      200
    );
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

    if (!email) {
      return errorResponse(res, 'Email is required.', 400);
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
      '+emailVerificationToken +emailVerificationExpires +emailVerificationOtp'
    );

    if (!user) {
      return errorResponse(res, 'No account found with this email.', 404);
    }

    if (user.isEmailVerified) {
      return errorResponse(res, 'This email is already verified.', 400);
    }

    const { token, otp } = user.generateEmailVerificationToken();
    await user.save();

    console.log(`[Resend] Generated OTP: ${otp} for ${email}`);

    // Send email - await to catch errors properly
    sendVerificationEmail(email, user.fullName, token, otp)
      .then((result) => {
        if (result.success) {
          console.log(`[Resend] ✅ Email sent to ${email}`);
        } else {
          console.error(`[Resend] ❌ Email failed: ${result.error}`);
        }
      })
      .catch((emailErr) => {
        console.error('[Resend] Email error:', emailErr.message);
      });

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

    // Enforce email verification: User cannot log in unless email is verified
    if (!user.isEmailVerified) {
      const userWithToken = await User.findById(user._id).select(
        '+emailVerificationToken +emailVerificationExpires +emailVerificationOtp'
      );

      // Only generate a new OTP if none exists or existing one is expired
      const otpExpired = !userWithToken.emailVerificationExpires || userWithToken.emailVerificationExpires < Date.now();
      const hasValidOtp = userWithToken.emailVerificationOtp && !otpExpired;

      if (!hasValidOtp) {
        // Generate fresh OTP + token
        const { token: tokenToSend, otp: otpToSend } = userWithToken.generateEmailVerificationToken();
        await userWithToken.save();

        // Send new verification email in background
        sendVerificationEmail(user.email, user.fullName, tokenToSend, otpToSend).catch((emailErr) => {
          console.error('Email send failed on unverified login attempt:', emailErr.message);
        });
        console.log(`[Login] New OTP generated for ${user.email} (previous was expired/missing)`);
      } else {
        console.log(`[Login] Valid OTP still exists for ${user.email} - NOT regenerating`);
      }


      return res.status(403).json({
        success: false,
        requiresEmailVerification: true,
        message:
          'Your email is not verified. A verification link has been sent to your email. Please verify your email before logging in.',
        data: { email: user.email },
      });
    }

    // Clean up verification tokens on successful login if they were kept
    const userToUpdate = await User.findById(user._id).select('+emailVerificationToken +emailVerificationExpires');
    if (userToUpdate && userToUpdate.emailVerificationToken) {
      userToUpdate.emailVerificationToken = undefined;
      userToUpdate.emailVerificationExpires = undefined;
      userToUpdate.lastLogin = new Date();
      await userToUpdate.save();
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

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

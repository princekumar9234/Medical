const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  const baseConfig = {
    connectionTimeout: 6000, // 6s timeout for connecting to SMTP server
    greetingTimeout: 6000,
    socketTimeout: 10000,
  };

  // Use Gmail service directly if using gmail
  if (host.includes('gmail') || (user && user.endsWith('@gmail.com'))) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      ...baseConfig,
    });
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // TLS
    auth: { user, pass },
    ...baseConfig,
  });
};

/**
 * Send email verification link
 */
const sendVerificationEmail = async (email, fullName, token, otp) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://medical-tau-red.vercel.app';
  const verifyUrl = `${frontendUrl.replace(/\/$/, '')}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  console.log(`[EmailService] Dispatching verification email for: ${email} (OTP: ${otp})`);
  console.log(`[EmailService] Verification URL: ${verifyUrl}`);

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `MediQ <${process.env.EMAIL_USER || 'no-reply@mediq.com'}>`,
      to: email,
      subject: `Your MediQ Verification Code: ${otp || 'Email Verification'}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #16a34a; padding: 28px 40px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 26px; font-weight: 700;">MediQ Healthcare</h1>
            <p style="color: #bbf7d0; margin: 6px 0 0; font-size: 13px;">Secure Account Verification</p>
          </div>
          <div style="padding: 36px 32px;">
            <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 12px;">Hello, ${fullName}!</h2>
            <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 14px;">
              Thank you for signing up with MediQ. Use the 6-digit verification code below to verify your account:
            </p>

            ${
              otp
                ? `
            <div style="background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 18px 24px; text-align: center; margin: 24px 0;">
              <p style="margin: 0 0 6px; font-size: 11px; color: #15803d; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Your 6-Digit Verification Code</p>
              <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #16a34a; font-family: monospace;">${otp}</div>
            </div>
            `
                : ''
            }

            <p style="color: #475569; line-height: 1.6; margin: 20px 0 12px; font-size: 14px;">
              Or click the quick verification button below:
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${verifyUrl}" 
                 style="background: #16a34a; color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0;">
              This code and link expire in 24 hours. If you did not register for MediQ, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });
    console.log(`[EmailService] Verification email delivered to ${email}`);
    return { success: true, verifyUrl };
  } catch (err) {
    console.error(`[EmailService] Failed to send verification email to ${email}:`, err.message);
    return { success: false, error: err.message, verifyUrl };
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, fullName, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://medical-tau-red.vercel.app';
  const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${token}`;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `MediQ <${process.env.EMAIL_USER || 'no-reply@mediq.com'}>`,
      to: email,
      subject: 'Reset your MediQ password',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
          <div style="background: #16a34a; padding: 32px 40px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 700;">MediQ</h1>
            <p style="color: #bbf7d0; margin: 8px 0 0; font-size: 14px;">Healthcare platform</p>
          </div>
          <div style="padding: 40px;">
            <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px;">Password Reset Request</h2>
            <p style="color: #475569; line-height: 1.7; margin: 0 0 16px;">
              Hello <strong>${fullName}</strong>, we received a request to reset your password.
            </p>
            <p style="color: #475569; line-height: 1.7; margin: 0 0 24px;">
              Click the button below to set a new password. This link is valid for 1 hour.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetUrl}" 
                 style="background: #16a34a; color: #fff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">
              If you did not request this, please ignore this email. Your password will not change.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              <a href="${resetUrl}" style="color: #16a34a;">${resetUrl}</a>
            </p>
          </div>
        </div>
      `,
    });
    return { success: true, resetUrl };
  } catch (err) {
    console.error(`[EmailService] Failed to send password reset email to ${email}:`, err.message);
    return { success: false, error: err.message, resetUrl };
  }
};

/**
 * Send appointment notification email
 */
const sendAppointmentEmail = async (email, subject, body) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `MediQ <${process.env.EMAIL_USER || 'no-reply@mediq.com'}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
          <div style="background: #16a34a; padding: 32px 40px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 700;">MediQ</h1>
          </div>
          <div style="padding: 40px;">
            ${body}
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error(`[EmailService] Failed to send appointment email to ${email}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendAppointmentEmail };

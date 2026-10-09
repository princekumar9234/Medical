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
const sendVerificationEmail = async (email, fullName, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://medical-tau-red.vercel.app';
  const verifyUrl = `${frontendUrl.replace(/\/$/, '')}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  console.log(`[EmailService] Dispatching verification email for: ${email}`);
  console.log(`[EmailService] Verification URL: ${verifyUrl}`);

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `MediQ <${process.env.EMAIL_USER || 'no-reply@mediq.com'}>`,
      to: email,
      subject: 'Verify your MediQ email address',
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
          <div style="background: #16a34a; padding: 32px 40px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 700;">MediQ</h1>
            <p style="color: #bbf7d0; margin: 8px 0 0; font-size: 14px;">Healthcare platform</p>
          </div>
          <div style="padding: 40px;">
            <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 16px;">Hello, ${fullName}!</h2>
            <p style="color: #475569; line-height: 1.7; margin: 0 0 24px;">
              Thank you for registering with MediQ. Please verify your email address by clicking the button below.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyUrl}" 
                 style="background: #16a34a; color: #fff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0;">
              This link expires in 24 hours. If you did not create an account, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              If the button above doesn't work, copy and paste this URL into your browser:<br />
              <a href="${verifyUrl}" style="color: #16a34a;">${verifyUrl}</a>
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

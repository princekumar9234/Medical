const nodemailer = require('nodemailer');

/**
 * Create SMTP transporter
 * Priority: Brevo SMTP → Gmail SMTP → Generic SMTP
 */
const createTransporter = () => {
  // ── 1. Brevo (recommended for Railway/cloud — doesn't block port 587) ──
  if (process.env.BREVO_SMTP_KEY || process.env.BREVO_USER) {
    console.log('[EmailService] Using Brevo SMTP');
    return nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_USER || process.env.EMAIL_USER,
        pass: process.env.BREVO_SMTP_KEY,
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }

  // ── 2. Gmail SMTP (works locally; may be blocked on Railway) ──
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (user && user.endsWith('@gmail.com')) {
    console.log('[EmailService] Using Gmail SMTP');
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,      // SSL — more reliable than TLS 587 on cloud
      secure: true,   // use SSL
      auth: { user, pass },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
  }

  // ── 3. Generic SMTP ──
  console.log('[EmailService] Using generic SMTP');
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
};

// Determine the sender address
const getSenderAddress = () => {
  if (process.env.BREVO_FROM) return process.env.BREVO_FROM;
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  return `MediQ <${process.env.EMAIL_USER || 'no-reply@mediq.com'}>`;
};

/**
 * Send email verification link + OTP
 */
const sendVerificationEmail = async (email, fullName, token, otp) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://medical-tau-red.vercel.app';
  const verifyUrl = `${frontendUrl.replace(/\/$/, '')}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  console.log(`[EmailService] Sending verification to: ${email} | OTP: ${otp} | via: ${process.env.BREVO_SMTP_KEY ? 'Brevo' : 'Gmail'}`);

  try {
    const transporter = createTransporter();

    // Verify SMTP connection first (throws on failure)
    await transporter.verify();
    console.log('[EmailService] SMTP connection verified ✓');

    const info = await transporter.sendMail({
      from: getSenderAddress(),
      to: email,
      subject: `Your MediQ Verification Code: ${otp || 'Verify Email'}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 28px 40px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 26px; font-weight: 700;">MediQ Healthcare</h1>
            <p style="color: #bbf7d0; margin: 6px 0 0; font-size: 13px;">Secure Account Verification</p>
          </div>
          <div style="padding: 36px 32px;">
            <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 12px;">Hello, ${fullName}!</h2>
            <p style="color: #475569; line-height: 1.6; margin: 0 0 20px; font-size: 14px;">
              Thank you for signing up with MediQ. Use the 6-digit verification code below to verify your account:
            </p>

            ${otp ? `
            <div style="background: #f0fdf4; border: 2px dashed #16a34a; border-radius: 12px; padding: 20px 24px; text-align: center; margin: 24px 0;">
              <p style="margin: 0 0 10px; font-size: 11px; color: #15803d; font-weight: 700; text-transform: uppercase; letter-spacing: 2px;">
                Your 6-Digit Verification Code
              </p>
              <div style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #16a34a; font-family: 'Courier New', monospace; padding: 8px 0;">
                ${otp}
              </div>
              <p style="margin: 8px 0 0; font-size: 11px; color: #6b7280;">Valid for 24 hours</p>
            </div>
            ` : ''}

            <p style="color: #475569; line-height: 1.6; margin: 20px 0 12px; font-size: 14px;">
              Or click the verification button below:
            </p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${verifyUrl}"
                 style="background: #16a34a; color: #fff; padding: 13px 34px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
                ✓ Verify Email Address
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin: 24px 0 0;">
              If you did not create a MediQ account, you can safely ignore this email.
            </p>
          </div>
          <div style="background: #f8fafc; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} MediQ Healthcare · All rights reserved</p>
          </div>
        </div>
      `,
    });

    console.log(`[EmailService] ✅ Verification email delivered to ${email} | msgId: ${info.messageId}`);
    return { success: true, verifyUrl, messageId: info.messageId };
  } catch (err) {
    console.error(`[EmailService] ❌ FAILED to send to ${email}:`, err.message);
    console.error(`[EmailService] Error code: ${err.code} | Response: ${err.response}`);
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
      from: getSenderAddress(),
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
          </div>
        </div>
      `,
    });
    return { success: true, resetUrl };
  } catch (err) {
    console.error(`[EmailService] Failed to send password reset to ${email}:`, err.message);
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
      from: getSenderAddress(),
      to: email,
      subject,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
          <div style="background: #16a34a; padding: 32px 40px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 28px; font-weight: 700;">MediQ</h1>
          </div>
          <div style="padding: 40px;">${body}</div>
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

const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node to resolve IPv4 addresses first (fixes Railway connect ENETUNREACH IPv6 issue)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * Primary Transporter: service: 'gmail' (SSL port 465)
 */
const createPrimaryTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
};

/**
 * Fallback Transporter: Standard SMTP port 587 with STARTTLS
 */
const createFallbackTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    requireTLS: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
};

/**
 * Send email verification OTP + link with automatic fallback
 */
const sendVerificationEmail = async (email, fullName, token, otp) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://medical-tau-red.vercel.app';
  const verifyUrl = `${frontendUrl.replace(/\/$/, '')}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  console.log(`====================================================`);
  console.log(`[EMAIL DISPATCH] To: ${email} | Name: ${fullName}`);
  console.log(`[EMAIL DISPATCH] 🔑 6-DIGIT OTP: ${otp}`);
  console.log(`[EMAIL DISPATCH] 🔗 Link: ${verifyUrl}`);
  console.log(`====================================================`);

  const mailOptions = {
    from: `"MediQ Healthcare" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${otp} is your MediQ verification code`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background:#059669;padding:28px 32px;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px;">MediQ Healthcare</h1>
          <p style="color:#a7f3d0;margin:6px 0 0;font-size:13px;font-weight:500;">Secure Account Verification</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#0f172a;font-size:18px;margin:0 0 12px;font-weight:700;">Hello, ${fullName || 'User'}!</h2>
          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Thank you for signing up with MediQ. Use the 6-digit verification code below to verify your email address:
          </p>
          <div style="background:#f0fdf4;border:2px dashed #059669;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:11px;color:#047857;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Your 6-Digit Code</p>
            <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#059669;font-family:monospace;margin-left:12px;">${otp}</div>
            <p style="margin:8px 0 0;font-size:11px;color:#6b7280;">Valid for 24 hours</p>
          </div>
          <p style="color:#475569;font-size:13px;margin:0 0 16px;text-align:center;">Or click the button below to verify instantly:</p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${verifyUrl}" style="background:#059669;color:#fff;padding:12px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;box-shadow:0 2px 4px rgba(5,150,105,0.3);">
              Verify Email Address
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">If you did not request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  };

  // Attempt 1: Primary Transporter (service: gmail)
  try {
    const primary = createPrimaryTransporter();
    const info = await primary.sendMail(mailOptions);
    console.log(`[Email] ✅ Sent successfully via Primary (service: gmail) to ${email} | ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err1) {
    console.warn(`[Email] ⚠️ Primary transporter failed (${err1.message}). Trying fallback port 587...`);

    // Attempt 2: Fallback Transporter (smtp.gmail.com:587)
    try {
      const fallback = createFallbackTransporter();
      const info = await fallback.sendMail(mailOptions);
      console.log(`[Email] ✅ Sent successfully via Fallback (port 587) to ${email} | ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err2) {
      console.error(`[Email] ❌ Both email attempts failed for ${email}`);
      console.error(`[Email] Error 1: ${err1.message}`);
      console.error(`[Email] Error 2: ${err2.message}`);
      return { success: false, error: err1.message || err2.message };
    }
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, fullName, token) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://medical-tau-red.vercel.app';
  const resetUrl = `${frontendUrl.replace(/\/$/, '')}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"MediQ Healthcare" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your MediQ password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#059669;margin:0;font-size:24px;font-weight:700;">MediQ Healthcare</h1>
        </div>
        <h2 style="color:#0f172a;font-size:18px;">Password Reset Request</h2>
        <p style="color:#475569;line-height:1.6;font-size:14px;">Hello <strong>${fullName}</strong>, click below to reset your password. This link is valid for 1 hour.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${resetUrl}" style="background:#059669;color:#fff;padding:12px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color:#94a3b8;font-size:12px;">If you did not request this password reset, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const primary = createPrimaryTransporter();
    await primary.sendMail(mailOptions);
  } catch {
    const fallback = createFallbackTransporter();
    await fallback.sendMail(mailOptions);
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};

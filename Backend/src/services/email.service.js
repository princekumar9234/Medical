const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node to resolve IPv4 addresses first (fixes Railway connect ENETUNREACH IPv6 issue)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * Create Gmail SMTP transporter using port 465 (SSL)
 * Port 465 SSL + IPv4 (family: 4) works reliably on Railway/cloud platforms
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL
    family: 4,    // Force IPv4 network socket (prevents ENETUNREACH on IPv6)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
  });
};

/**
 * Send email verification OTP + link
 */
const sendVerificationEmail = async (email, fullName, token, otp) => {
  const frontendUrl = process.env.FRONTEND_URL || 'https://medical-tau-red.vercel.app';
  const verifyUrl = `${frontendUrl.replace(/\/$/, '')}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  console.log(`[Email] Sending OTP to: ${email} | OTP: ${otp}`);
  console.log(`[Email] EMAIL_USER: ${process.env.EMAIL_USER}`);
  console.log(`[Email] EMAIL_PASS set: ${process.env.EMAIL_PASS ? 'YES' : 'NO'}`);

  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"MediQ Healthcare" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${otp} is your MediQ verification code`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <div style="background:#16a34a;padding:24px 32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">MediQ Healthcare</h1>
            <p style="color:#bbf7d0;margin:4px 0 0;font-size:13px;">Secure Account Verification</p>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#0f172a;font-size:18px;margin:0 0 12px;">Hello, ${fullName}!</h2>
            <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
              Use the 6-digit code below to verify your MediQ account:
            </p>
            <div style="background:#f0fdf4;border:2px dashed #16a34a;border-radius:10px;padding:20px;text-align:center;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-size:11px;color:#15803d;font-weight:700;text-transform:uppercase;letter-spacing:2px;">Your Verification Code</p>
              <div style="font-size:40px;font-weight:800;letter-spacing:10px;color:#16a34a;font-family:monospace;">${otp}</div>
              <p style="margin:8px 0 0;font-size:11px;color:#6b7280;">Valid for 24 hours</p>
            </div>
            <p style="color:#475569;font-size:13px;margin:0 0 16px;">Or click the button below:</p>
            <div style="text-align:center;margin-bottom:24px;">
              <a href="${verifyUrl}" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="color:#94a3b8;font-size:12px;">If you did not create a MediQ account, ignore this email.</p>
          </div>
        </div>
      `,
    });

    console.log(`[Email] ✅ Sent to ${email} | ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Email] ❌ FAILED for ${email}: ${err.message}`);
    console.error(`[Email] Code: ${err.code} | Response: ${err.response || 'N/A'}`);
    return { success: false, error: err.message };
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
      from: `"MediQ Healthcare" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset your MediQ password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;">
          <div style="background:#16a34a;padding:28px 32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">MediQ</h1>
          </div>
          <div style="padding:32px;">
            <h2 style="color:#0f172a;">Password Reset Request</h2>
            <p style="color:#475569;line-height:1.6;">Hello <strong>${fullName}</strong>, click below to reset your password. This link is valid for 1 hour.</p>
            <div style="text-align:center;margin:28px 0;">
              <a href="${resetUrl}" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color:#94a3b8;font-size:12px;">If you did not request this, ignore this email.</p>
          </div>
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error(`[Email] Password reset failed for ${email}:`, err.message);
    return { success: false, error: err.message };
  }
};

/**
 * Send appointment notification email
 */
const sendAppointmentEmail = async (email, subject, body) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"MediQ Healthcare" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#fff;">
          <div style="background:#16a34a;padding:28px 32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;">MediQ</h1>
          </div>
          <div style="padding:32px;">${body}</div>
        </div>
      `,
    });
    return { success: true };
  } catch (err) {
    console.error(`[Email] Appointment email failed for ${email}:`, err.message);
    return { success: false, error: err.message };
  }
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendAppointmentEmail };

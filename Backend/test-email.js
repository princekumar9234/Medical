require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length || 'NOT SET');

const t = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 20000,
  socketTimeout: 30000,
});

t.verify((err) => {
  if (err) {
    console.log('VERIFY FAIL:', err.message);
    process.exit(1);
  }
  console.log('Gmail SSL Connected!');
  t.sendMail({
    from: `MediQ <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: '847291 is your MediQ verification code',
    text: 'Your OTP is: 847291',
  }, (err2, info) => {
    if (err2) { console.log('SEND FAIL:', err2.message); }
    else { console.log('EMAIL SENT! ID:', info.messageId); }
    process.exit(0);
  });
});

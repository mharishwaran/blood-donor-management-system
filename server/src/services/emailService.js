import nodemailer from 'nodemailer';
import {
  generateOTPTemplate,
  generatePasswordChangedTemplate,
  generateWelcomeTemplate,
  generateLoginSuccessTemplate,
  generateEmailVerificationTemplate
} from '../utils/emailTemplates/index.js';
const smtpPort = Number(process.env.SMTP_PORT || 465);
const smtpSecure = process.env.SMTP_SECURE === "true";

const smtpHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
/* const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE === 'true'; */
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const defaultFrom =
  process.env.SMTP_FROM ||
  'Blood Donor Management System <blood.donor2026@gmail.com>';

console.log('========== SMTP CONFIG ==========');
console.log({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  user: smtpUser,
  passExists: !!smtpPass
});
console.log('=================================');

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: Number(process.env.SMTP_PORT),
  secure: false,

  auth: {
    user: smtpUser,
    pass: smtpPass,
  },

  tls: {
    rejectUnauthorized: false,
  },

  family: 4,

  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000,
});

(async () => {
  try {
    await transporter.verify();
    console.log('✅ SMTP transporter ready');
  } catch (error) {
    console.error('❌ SMTP Verify Error');
    console.error(error);
  }
})();

export const sendMail = async ({
  to,
  subject,
  html,
  from = defaultFrom
}) => {
  try {
    console.log('=================================');
    console.log('📧 Sending Email');
    console.log({
      from,
      to,
      subject
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html
    });

    console.log('✅ Email Sent Successfully');
    console.log(info);
    console.log('=================================');

    return info;
  } catch (error) {
    console.log('=================================');
    console.error('❌ SEND MAIL ERROR');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Command:', error.command);
    console.error('Response:', error.response);
    console.error('ResponseCode:', error.responseCode);
    console.error(error);
    console.log('=================================');

    throw error;
  }
};

export const sendPasswordResetOtp = async ({
  to,
  name,
  otp,
  expiryMinutes = 10
}) => {
  const html = generateOTPTemplate({
    name,
    otp,
    expiryMinutes
  });

  return sendMail({
    to,
    subject: 'Password Reset OTP',
    html
  });
};

export const sendPasswordResetSuccess = async ({
  to,
  name,
  changedAt
}) => {
  const html = generatePasswordChangedTemplate({
    name,
    changedAt
  });

  return sendMail({
    to,
    subject: 'Password Changed Successfully',
    html
  });
};

export const sendWelcomeEmail = async ({
  to,
  name,
  email
}) => {
  const html = generateWelcomeTemplate({
    name,
    email
  });

  return sendMail({
    to,
    subject: 'Welcome to Blood Donor Management System',
    html
  });
};

export const sendVerificationEmail = async ({
  to,
  name,
  verificationUrl
}) => {
  const html = generateEmailVerificationTemplate({
    name,
    verificationUrl
  });

  return sendMail({
    to,
    subject: 'Verify Your Email',
    html
  });
};

export const sendLoginSuccessEmail = async ({
  to,
  name,
  loginTime,
  browser,
  device
}) => {
  const html = generateLoginSuccessTemplate({
    name,
    loginTime,
    browser,
    device
  });

  return sendMail({
    to,
    subject: 'Login Successful',
    html
  });
};
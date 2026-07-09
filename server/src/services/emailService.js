// mailService.js
import axios from "axios";

import {
  generateOTPTemplate,
  generatePasswordChangedTemplate,
  generateWelcomeTemplate,
  generateLoginSuccessTemplate,
  generateEmailVerificationTemplate,
} from "../utils/emailTemplates/index.js";

const API_URL = "https://api.brevo.com/v3/smtp/email";

const apiKey = process.env.BREVO_API_KEY;

console.log("========== BREVO CONFIG ==========");
console.log({
  apiKeyExists: !!apiKey,
  apiKeyPrefix: apiKey ? apiKey.substring(0, 8) : "NOT FOUND",
  senderEmail: process.env.BREVO_SENDER_EMAIL,
  senderName: process.env.BREVO_SENDER_NAME,
});
console.log("=================================");

const sender = {
  name:
    process.env.BREVO_SENDER_NAME ||
    "Blood Donor Management System",
  email:
    process.env.BREVO_SENDER_EMAIL ||
    "blood.donor2026@gmail.com",
};

export const sendMail = async ({ to, subject, html }) => {
  try {
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is missing");
    }

    const response = await axios.post(
      API_URL,
      {
        sender,
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": apiKey,
        },
      }
    );

    console.log("✅ Email Sent Successfully");
    console.log(response.data);

    return response.data;
  } catch (err) {
    console.error("=================================");
    console.error("❌ BREVO API ERROR");

    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Data:", err.response.data);
    } else {
      console.error(err.message);
    }

    console.error("=================================");

    throw err;
  }
};

// ================= PASSWORD RESET OTP =================

export const sendPasswordResetOtp = ({
  to,
  name,
  otp,
  expiryMinutes = 10,
}) =>
  sendMail({
    to,
    subject: "Password Reset OTP",
    html: generateOTPTemplate({
      name,
      otp,
      expiryMinutes,
    }),
  });

// ================= PASSWORD RESET SUCCESS =================

export const sendPasswordResetSuccess = ({
  to,
  name,
  changedAt,
}) =>
  sendMail({
    to,
    subject: "Password Changed Successfully",
    html: generatePasswordChangedTemplate({
      name,
      changedAt,
    }),
  });

// ================= WELCOME EMAIL =================

export const sendWelcomeEmail = ({
  to,
  name,
  email,
}) =>
  sendMail({
    to,
    subject: "Welcome to Blood Donor Management System",
    html: generateWelcomeTemplate({
      name,
      email,
    }),
  });

// ================= EMAIL VERIFICATION =================

export const sendVerificationEmail = ({
  to,
  name,
  verificationUrl,
}) =>
  sendMail({
    to,
    subject: "Verify Your Email",
    html: generateEmailVerificationTemplate({
      name,
      verificationUrl,
    }),
  });

// ================= LOGIN SUCCESS =================

export const sendLoginSuccessEmail = ({
  to,
  name,
  loginTime,
  browser,
  device,
}) =>
  sendMail({
    to,
    subject: "Login Successful",
    html: generateLoginSuccessTemplate({
      name,
      loginTime,
      browser,
      device,
    }),
  });

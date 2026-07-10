import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import { sendResponse } from '../utils/response.js';
import passport from '../config/passport.js';
import { addNotificationJob } from '../jobs/notificationQueue.js';
import {
  sendPasswordResetOtp,
  sendPasswordResetSuccess,
  sendWelcomeEmail,
  sendLoginSuccessEmail
} from '../services/emailService.js';
import { getJwtSecret } from '../utils/adminAuth.js';

const generateToken = (user) => {
  const payload = { id: user._id, role: user.role };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

const getClientUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

const generateOtp = () => crypto.randomInt(100000, 999999).toString();
const normalizeEmail = (value = '') => value.trim().toLowerCase();
const isConfiguredAdminEmail = (email = '') => normalizeEmail(email) === normalizeEmail(process.env.ADMIN_EMAIL || '');
const syncAdminRole = async (user) => {
  if (user && isConfiguredAdminEmail(user.email) && user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
  }
  return user;
};
const sanitizeUser = (user) => {
  const safeUser = user.toObject ? user.toObject() : { ...user };
  delete safeUser.password;
  delete safeUser.resetOTP;
  delete safeUser.resetOTPExpiry;
  delete safeUser.otpResendCount;
  delete safeUser.otpResendAt;
  return safeUser;
};
const safelySendEmail = async (sendFn, payload, label) => {
  try {
    console.log("📧 Calling sendMail...");
    await sendFn(payload);
    console.log("✅ Mail sent successfully");
    return true;
  } catch (error) {
    console.error("❌ Mail Error:", error);
    return false;
  }
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name?.trim() || !normalizedEmail || !password || password.length < 8) {
      return sendResponse(res, 400, false, 'Name, email and password are required and password must be at least 8 characters long');
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) return sendResponse(res, 400, false, 'User already exists');

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password });
    const persistedUser = await syncAdminRole(user);
    const token = generateToken(persistedUser);
    const isNewUser = true;
    const responsePayload = { token, user: sanitizeUser(persistedUser), isNewUser };

    sendResponse(res, 201, true, 'Registration successful', responsePayload);

    void (async () => {
      await safelySendEmail(
        sendWelcomeEmail,
        { to: user.email, name: user.name, email: user.email },
        'Welcome email'
      );
    })();
    return;
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return sendResponse(res, 401, false, 'Invalid email or password');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return sendResponse(res, 401, false, 'Invalid email or password');

    const persistedUser = await syncAdminRole(user);
    const token = generateToken(persistedUser);
    const responsePayload = { token, user: sanitizeUser(persistedUser), isNewUser: false };

    sendResponse(res, 200, true, 'Login successful', responsePayload);

    void (async () => {
      await safelySendEmail(
        sendLoginSuccessEmail,
        {
          to: user.email,
          name: user.name,
          loginTime: new Date().toLocaleString(),
          browser: req.headers['user-agent'] || 'Unknown browser',
          device: 'Web'
        },
        'Login success email'
      );

      try {
        await addNotificationJob({ userId: user._id, title: 'Welcome', message: 'Login successful', email: user.email, type: 'info' });
        console.log('[auth-debug] login notification queue job created', { userId: user._id.toString(), email: user.email });
      } catch (queueError) {
        console.error('[auth-debug] login notification queue job failed', { userId: user._id.toString(), error: queueError.message });
      }
    })();
    return;
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const me = async (req, res) => {
  console.log('[auth-debug] me route for user', { email: req.user?.email, userId: req.user?._id?.toString() });
  return sendResponse(res, 200, true, 'Profile fetched', { user: req.user });
};

export const googleAuth = passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' });

export const googleAuthCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    if (err) {
      console.error('Google auth error', err);
      return res.redirect(`${getClientUrl()}/login?error=google_auth_failed`);
    }

    if (!user) {
      return res.redirect(`${getClientUrl()}/login?error=google_auth_failed`);
    }

    const persistedUser = await syncAdminRole(user);
    const token = generateToken(persistedUser);
    const isNewUser = info?.isNewUser ?? false;
    const frontendRedirect = `${getClientUrl()}/auth/google/callback?token=${encodeURIComponent(token)}&isNewUser=${isNewUser}`;

    void (async () => {
      if (isNewUser) {
        await safelySendEmail(
          sendWelcomeEmail,
          { to: user.email, name: user.name, email: user.email },
          'Welcome email for new Google user'
        );
      }

      await safelySendEmail(
        sendLoginSuccessEmail,
        {
          to: user.email,
          name: user.name,
          loginTime: new Date().toLocaleString(),
          browser: req.headers['user-agent'] || 'Unknown browser',
          device: 'Google OAuth'
        },
        'Google login success email'
      );

      try {
        await addNotificationJob({ userId: user._id, title: 'Welcome', message: 'Google login successful', email: user.email, type: 'info' });
        console.log('[auth-debug] google login notification queue job created', { userId: user._id.toString(), email: user.email });
      } catch (queueError) {
        console.error('[auth-debug] google login notification queue job failed', { userId: user._id.toString(), error: queueError.message });
      }
    })();

    return res.redirect(frontendRedirect);
  })(req, res, next);
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return sendResponse(res, 404, false, 'User not found');

    const otp = generateOtp();
    user.resetOTP = otp;
    user.resetOTPExpiry = new Date(Date.now() + 5 * 60 * 1000);
    user.otpResendCount = 0;
    user.otpResendAt = null;
    await user.save();

    console.log("OTP generated:", otp);
    console.log("Sending OTP to:", user.email);

    const mailSent = await safelySendEmail(
      sendPasswordResetOtp,
      { to: user.email, name: user.name, otp, expiryMinutes: 5 },
      'Password reset OTP email'
    );

    if (!mailSent) {
      return sendResponse(res, 500, false, 'Unable to send OTP email right now. Please try again later.');
    }

    await addNotificationJob({ userId: user._id, title: 'Password reset OTP', message: `Use ${otp} to reset your password`, email: user.email, type: 'security' });
    return sendResponse(res, 200, true, 'OTP sent to your registered email address');
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return sendResponse(res, 404, false, 'User not found');

    if (!user.resetOTP || !user.resetOTPExpiry) {
      return sendResponse(res, 400, false, 'No OTP request found. Please request a new one.');
    }

    const now = new Date();
    const minimumIntervalMs = 30 * 1000;
    const resendLimit = 5;

    if (user.otpResendAt && now.getTime() - new Date(user.otpResendAt).getTime() < minimumIntervalMs) {
      return sendResponse(res, 429, false, 'Please wait 30 seconds before requesting another OTP.');
    }

    if (user.otpResendCount >= resendLimit) {
      return sendResponse(res, 429, false, 'You have reached the maximum number of OTP resend attempts.');
    }

    const otp = generateOtp();
    user.resetOTP = otp;
    user.resetOTPExpiry = new Date(Date.now() + 5 * 60 * 1000);
    user.otpResendCount += 1;
    user.otpResendAt = now;
    await user.save();

    const mailSent = await safelySendEmail(
      sendPasswordResetOtp,
      { to: user.email, name: user.name, otp, expiryMinutes: 5 },
      'Password reset OTP email'
    );

    if (!mailSent) {
      return sendResponse(res, 500, false, 'Unable to resend OTP right now. Please try again later.');
    }

    await addNotificationJob({ userId: user._id, title: 'OTP resent', message: `A new OTP was sent to ${user.email}`, email: user.email, type: 'security' });
    return sendResponse(res, 200, true, 'A new OTP has been sent to your email.');
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return sendResponse(res, 404, false, 'User not found');
    if (!user.resetOTP || !user.resetOTPExpiry) return sendResponse(res, 400, false, 'No OTP request found. Please request a new one.');
    if (user.resetOTP !== otp) return sendResponse(res, 400, false, 'Invalid OTP');
    if (user.resetOTPExpiry < new Date()) return sendResponse(res, 400, false, 'OTP has expired. Please request a new one.');

    return sendResponse(res, 200, true, 'OTP verified successfully');
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return sendResponse(res, 404, false, 'User not found');
    if (!user.resetOTP || !user.resetOTPExpiry) return sendResponse(res, 400, false, 'OTP verification is required before resetting the password');
    if (user.resetOTP !== otp) return sendResponse(res, 400, false, 'Invalid OTP');
    if (user.resetOTPExpiry < new Date()) return sendResponse(res, 400, false, 'OTP has expired. Please request a new one.');

    user.password = password;
    user.resetOTP = null;
    user.resetOTPExpiry = null;
    await user.save();

    void (async () => {
      await safelySendEmail(
        sendPasswordResetSuccess,
        { to: user.email, name: user.name, changedAt: new Date().toLocaleString() },
        'Password reset success email'
      );

      try {
        await addNotificationJob({ userId: user._id, title: 'Password changed', message: 'Your password was reset successfully', email: user.email, type: 'info' });
      } catch (queueError) {
        console.error('[auth-debug] password reset notification queue job failed', { userId: user._id.toString(), error: queueError.message });
      }
    })();

    return sendResponse(res, 200, true, 'Password reset successfully');
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

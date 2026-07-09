import express from 'express';
import { login, me, register, forgotPassword, verifyOTP, resetPassword, resendOTP, googleAuth, googleAuthCallback } from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { validateForgotPassword, validateResendOtp, validateResetPassword, validateVerifyOtp } from '../middlewares/forgotPasswordValidation.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/google', authLimiter, googleAuth);
router.get('/google/callback', authLimiter, googleAuthCallback);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/verify-otp', authLimiter, validateVerifyOtp, verifyOTP);
router.post('/resend-otp', authLimiter, validateResendOtp, resendOTP);
router.post('/reset-password', authLimiter, validateResetPassword, resetPassword);
router.get('/me', protect, me);

export default router;

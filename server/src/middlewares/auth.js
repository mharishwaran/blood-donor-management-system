import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendResponse } from '../utils/response.js';
import { getJwtSecret } from '../utils/adminAuth.js';

const verifyToken = (token) => jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });

export const protect = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required');
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendResponse(res, 401, false, 'Authorization header missing or invalid');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password -resetOTP -resetOTPExpiry -otpResendCount -otpResendAt');

    if (!user) {
      return sendResponse(res, 401, false, 'User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    console.warn('[auth-debug] protect token failed', error.message);
    if (error.name === 'TokenExpiredError') {
      return sendResponse(res, 401, false, 'Token expired. Please login again.');
    }
    return sendResponse(res, 401, false, 'Invalid token. Please login again.');
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return sendResponse(res, 403, false, 'Admin access only');
  }
  next();
};

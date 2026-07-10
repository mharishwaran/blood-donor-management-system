import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendResponse } from '../utils/response.js';
import { getJwtSecret, isAdminEmail } from '../utils/adminAuth.js';

const parseCookies = (cookieHeader = '') =>
  cookieHeader.split(';').reduce((cookies, cookiePair) => {
    const [name, ...rest] = cookiePair.split('=');
    if (!name || !rest.length) return cookies;
    cookies[name.trim()] = decodeURIComponent(rest.join('=').trim());
    return cookies;
  }, {});

const normalizeEmail = (value = '') => value.toString().trim().toLowerCase();
const isAdminRole = (value = '') => normalizeEmail(value) === 'admin';

const extractAdminToken = (req) => {
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies.adminToken) return cookies.adminToken;
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
};

const verifyAdminToken = (token) => {
  if (!token) throw new Error('Missing admin token');
  const secret = getJwtSecret();
  if (!secret) throw new Error('Admin JWT secret must be configured');
  return jwt.verify(token, secret, { algorithms: ['HS256'] });
};

export const verifyAdmin = async (req, res, next) => {
  try {
    const token = extractAdminToken(req);
    if (!token) {
      return sendResponse(res, 401, false, 'Authentication required. Please log in again.');
    }

    const decoded = verifyAdminToken(token);
    const normalizedEmail = normalizeEmail(decoded?.email || '');
    const hasAdminRole = isAdminRole(decoded?.role || '');
    const adminEmailMatches = Boolean(normalizedEmail && isAdminEmail(normalizedEmail, process.env.ADMIN_EMAIL || ''));

    let adminUser = null;
    if (decoded?.id) {
      adminUser = await User.findById(decoded.id).select('name email role');
    }

    if (!adminUser && normalizedEmail) {
      adminUser = await User.findOne({ email: normalizedEmail }).select('name email role');
    }

    const isValidAdmin = Boolean(adminUser && (adminUser.role === 'admin' || adminEmailMatches || hasAdminRole));
    if (!decoded || (!adminEmailMatches && !hasAdminRole && !isValidAdmin)) {
      return sendResponse(res, 403, false, 'Admin access required.');
    }

    req.admin = {
      id: decoded.id || adminUser?._id?.toString() || null,
      email: adminUser?.email || decoded.email || '',
      role: adminUser?.role || decoded.role || 'admin',
      loginTime: decoded.loginTime || null
    };
    req.user = req.user || { _id: req.admin.id, email: req.admin.email, role: req.admin.role };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendResponse(res, 401, false, 'Admin session expired. Please log in again.');
    }
    console.error('verifyAdmin failed:', error.message);
    return sendResponse(res, 401, false, 'Authentication failed. Please log in again.');
  }
};

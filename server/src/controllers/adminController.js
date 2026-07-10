import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Donor from '../models/Donor.js';
import EmergencyRequest from '../models/EmergencyRequest.js';
import { sendResponse } from '../utils/response.js';
import { normalizeEmergencyStatus } from '../utils/adminUtils.js';
import { getJwtSecret, isAdminEmail } from '../utils/adminAuth.js';

const normalizeEmail = (value = '') => value.toString().trim().toLowerCase();
const getAdminConfig = () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const secret = getJwtSecret();

  if (!email || !password || !secret) {
    throw new Error('ADMIN_EMAIL, ADMIN_PASSWORD, and JWT secret must be configured');
  }

  return { email, password, secret };
};

const ensureAdminUser = async (email, password) => {
  const normalizedEmail = normalizeEmail(email);
  let admin = await User.findOne({ email: normalizedEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Admin',
      email: normalizedEmail,
      password,
      role: 'admin'
    });
  } else if (admin.role !== 'admin') {
    admin.role = 'admin';
    await admin.save();
  }
  return admin;
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { email: adminEmail, password: adminPassword, secret } = getAdminConfig();

    if (!email || !password) {
      return sendResponse(res, 400, false, 'Email and password are required');
    }

    if (normalizeEmail(email) !== normalizeEmail(adminEmail) || password !== adminPassword) {
      return sendResponse(res, 401, false, 'Unauthorized');
    }

    const adminUser = await ensureAdminUser(adminEmail, adminPassword);
    const loginTime = new Date().toISOString();
    const token = jwt.sign({ id: adminUser._id.toString(), email: normalizeEmail(adminEmail), role: 'admin', loginTime }, secret, {
      expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d'
    });

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return sendResponse(res, 200, true, 'Admin login successful', { token });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const adminLogout = async (req, res) => {
  res.clearCookie('adminToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none'
  });
  return sendResponse(res, 200, true, 'Admin logged out');
};

export const adminDashboard = async (req, res) => {
  try {
    const [totalUsers, totalDonors, availableDonors, unavailableDonors, emergencyRequests, pendingRequests, completedRequests, todaysRegistrations, todaysEmergencyRequests, registrationSeries, bloodGroupDistribution, emergencyByStatus, recentUsers, recentRequests, recentDonors] = await Promise.all([
      User.countDocuments(),
      Donor.countDocuments(),
      Donor.countDocuments({ availability: true }),
      Donor.countDocuments({ availability: false }),
      EmergencyRequest.countDocuments(),
      EmergencyRequest.countDocuments({ status: 'pending' }),
      EmergencyRequest.countDocuments({ status: 'fulfilled' }),
      User.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      EmergencyRequest.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(new Date().setFullYear(new Date().getFullYear(), new Date().getMonth() - 11, 1)) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      Donor.aggregate([
        { $group: { _id: '$bloodGroup', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      EmergencyRequest.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      User.find({ role: { $ne: 'admin' } }).sort({ createdAt: -1 }).limit(5).select('-password -resetOTP -resetOTPExpiry -otpResendCount -otpResendAt').lean(),
      EmergencyRequest.find().sort({ createdAt: -1 }).limit(5).lean(),
      Donor.find().sort({ createdAt: -1 }).limit(5).select('name bloodGroup city availability phone createdAt').lean()
    ]);

    const normalizedRegistrationSeries = registrationSeries.map((item) => ({
      _id: item._id,
      month: new Date(item._id.year, item._id.month - 1, 1).toLocaleString('en', { month: 'short' }),
      count: item.count
    }));

    const bloodGroupOrder = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodGroupCounts = Object.fromEntries(bloodGroupDistribution.map((item) => [item._id, item.count]));
    const normalizedBloodGroupDistribution = bloodGroupOrder
      .filter((group) => bloodGroupCounts[group])
      .map((group) => ({ _id: group, count: bloodGroupCounts[group] }));

    const normalizedEmergencyByStatus = ['pending', 'active', 'fulfilled', 'cancelled'].map((status) => ({
      _id: status,
      count: emergencyByStatus.find((item) => item._id === status)?.count || 0
    }));

    return sendResponse(res, 200, true, 'Admin dashboard data fetched', {
      totalUsers,
      totalDonors,
      availableDonors,
      unavailableDonors,
      emergencyRequests,
      pendingRequests,
      completedRequests,
      todaysRegistrations,
      todaysEmergencyRequests,
      registrationSeries: normalizedRegistrationSeries,
      bloodGroupDistribution: normalizedBloodGroupDistribution,
      emergencyByStatus: normalizedEmergencyByStatus,
      recentUsers,
      recentRequests,
      recentDonors
    });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sort = 'createdAt', order = 'desc' } = req.query;
    const query = { role: { $ne: 'admin' } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bloodGroup: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'asc' ? 1 : -1;
    const users = await User.find(query)
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .select('-password -resetOTP -resetOTPExpiry -otpResendCount -otpResendAt');
    const total = await User.countDocuments(query);
    return sendResponse(res, 200, true, 'Users fetched', { users, total });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const getDonors = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sort = 'createdAt', order = 'desc' } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bloodGroup: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'asc' ? 1 : -1;
    const donors = await Donor.find(query)
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name email');
    const total = await Donor.countDocuments(query);
    return sendResponse(res, 200, true, 'Donors fetched', { donors, total });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const updateDonorAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    if (typeof availability !== 'boolean') {
      return sendResponse(res, 400, false, 'Availability must be a boolean');
    }

    const donor = await Donor.findById(req.params.id);
    if (!donor) return sendResponse(res, 404, false, 'Donor not found');

    donor.availability = availability;
    await donor.save();

    return sendResponse(res, 200, true, 'Donor availability updated', { donor });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

const getAllowedUserUpdates = (payload) => {
  const allowedFields = ['name', 'email', 'phone', 'department', 'year', 'city', 'bloodGroup', 'availability'];
  return Object.keys(payload).reduce((updates, key) => {
    if (allowedFields.includes(key)) {
      updates[key] = payload[key];
    }
    return updates;
  }, {});
};

export const updateUser = async (req, res) => {
  try {
    const updates = getAllowedUserUpdates(req.body);
    if (updates.email) {
      updates.email = normalizeEmail(updates.email);
    }

    const user = await User.findById(req.params.id);
    if (!user) return sendResponse(res, 404, false, 'User not found');
    if (normalizeEmail(user.email) === normalizeEmail(process.env.ADMIN_EMAIL || '')) {
      return sendResponse(res, 403, false, 'Cannot modify admin user');
    }

    Object.assign(user, updates);
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.resetOTP;
    delete safeUser.resetOTPExpiry;
    delete safeUser.otpResendCount;
    delete safeUser.otpResendAt;

    return sendResponse(res, 200, true, 'User updated', { user: safeUser });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const authorizeAdmin = async (req, res) => {
  try {
    const { password } = req.body;
    const adminEmail = process.env.ADMIN_EMAIL;
    const dashboardPassword = process.env.ADMIN_PASSWORD;
    const secret = getJwtSecret();

    if (!req.user || !req.user.email || (!isAdminEmail(req.user.email, adminEmail) && req.user.role !== 'admin')) {
      return sendResponse(res, 403, false, 'Forbidden');
    }

    if (!dashboardPassword || !secret) {
      return sendResponse(res, 500, false, 'Admin configuration is not available');
    }

    if (!password || password.trim() !== dashboardPassword) {
      return sendResponse(res, 403, false, 'Incorrect admin password');
    }

    const loginTime = new Date().toISOString();
    const token = jwt.sign({ id: req.user?._id?.toString() || null, email: normalizeEmail(adminEmail), role: 'admin', loginTime }, secret, {
      expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '7d'
    });

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return sendResponse(res, 200, true, 'Admin authorized', { token });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -resetOTP -resetOTPExpiry -otpResendCount -otpResendAt');
    if (!user) return sendResponse(res, 404, false, 'User not found');
    return sendResponse(res, 200, true, 'User fetched', { user });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendResponse(res, 404, false, 'User not found');
    if (user.email === process.env.ADMIN_EMAIL) {
      return sendResponse(res, 403, false, 'Cannot delete admin user');
    }
    await user.deleteOne();
    return sendResponse(res, 200, true, 'User deleted');
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const toggleUserBlock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return sendResponse(res, 404, false, 'User not found');
    if (user.email === process.env.ADMIN_EMAIL) {
      return sendResponse(res, 403, false, 'Cannot modify admin user');
    }
    user.isBlocked = !user.isBlocked;
    await user.save();
    return sendResponse(res, 200, true, `User ${user.isBlocked ? 'blocked' : 'unblocked'}`);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const getEmergencyRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sort = 'createdAt', order = 'desc' } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { hospital: { $regex: search, $options: 'i' } },
        { patient: { $regex: search, $options: 'i' } },
        { bloodGroup: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { status: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const sortOrder = order === 'asc' ? 1 : -1;
    const requests = await EmergencyRequest.find(query)
      .sort({ [sort]: sortOrder })
      .skip(skip)
      .limit(Number(limit))
      .populate('requestedBy', 'name email');
    const total = await EmergencyRequest.countDocuments(query);
    return sendResponse(res, 200, true, 'Emergency requests fetched', { requests, total });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const updateEmergencyStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const normalizedStatus = normalizeEmergencyStatus(status);
    if (!normalizedStatus) {
      return sendResponse(res, 400, false, 'Invalid status');
    }
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) return sendResponse(res, 404, false, 'Emergency request not found');
    request.status = normalizedStatus;
    request.history.push({ message: `Status updated to ${normalizedStatus}` });
    await request.save();
    return sendResponse(res, 200, true, 'Emergency request status updated', { request });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const deleteEmergencyRequest = async (req, res) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) return sendResponse(res, 404, false, 'Emergency request not found');
    await request.deleteOne();
    return sendResponse(res, 200, true, 'Emergency request deleted');
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const adminProfile = async (req, res) => {
  try {
    const adminEmail = normalizeEmail(req.admin.email);
    let user = null;

    if (req.admin.id) {
      user = await User.findById(req.admin.id).select('name email role');
    }

    if (!user && adminEmail) {
      user = await User.findOne({ email: adminEmail }).select('name email role');
    }

    if (!user) {
      user = await ensureAdminUser(adminEmail, process.env.ADMIN_PASSWORD);
    }

    return sendResponse(res, 200, true, 'Admin profile fetched', {
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const trimmedName = name?.trim();
    if (!trimmedName) {
      return sendResponse(res, 400, false, 'Name is required');
    }

    const adminEmail = normalizeEmail(req.admin.email);
    let user = null;

    if (req.admin.id) {
      user = await User.findById(req.admin.id);
    }

    if (!user && adminEmail) {
      user = await User.findOne({ email: adminEmail });
    }

    if (!user) {
      user = await ensureAdminUser(adminEmail, process.env.ADMIN_PASSWORD);
    }

    const updates = { name: trimmedName };
    if (user.role !== 'admin') {
      updates.role = 'admin';
    }
    Object.assign(user, updates);
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    delete safeUser.resetOTP;
    delete safeUser.resetOTPExpiry;
    delete safeUser.otpResendCount;
    delete safeUser.otpResendAt;
    safeUser.isAdmin = isAdminEmail(user.email);

    return sendResponse(res, 200, true, 'Admin profile updated', { user: safeUser });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

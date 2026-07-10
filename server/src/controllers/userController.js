import Donor from '../models/Donor.js';
import User from '../models/User.js';
import { sendResponse } from '../utils/response.js';

const sanitizeUserUpdate = (body) => {
  const allowedFields = [
    'name',
    'phone',
    'department',
    'year',
    'city',
    'bloodGroup',
    'dateOfBirth',
    'profileImage',
    'availability',
    'lastDonationDate'
  ];

  const updates = {};
  if (body.dob !== undefined && body.dateOfBirth === undefined) {
    updates.dateOfBirth = body.dob || null;
  }

  for (const key of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      updates[key] = body[key];
    }
  }

  if (updates.dateOfBirth === '') {
    updates.dateOfBirth = null;
  }

  return updates;
};

export const updateProfile = async (req, res) => {
  try {
    const updates = sanitizeUserUpdate(req.body);
    if (Object.keys(updates).length === 0) {
      return sendResponse(res, 400, false, 'No valid fields provided for update');
    }

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) return sendResponse(res, 404, false, 'User not found');

    Object.assign(currentUser, updates);
    await currentUser.save();

    const user = await User.findById(req.user._id).select('-password');

    const donorUpdates = {
      user: req.user._id,
      name: user.name,
      bloodGroup: user.bloodGroup,
      department: user.department,
      year: user.year,
      city: user.city,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      availability: user.availability,
      lastDonationDate: user.lastDonationDate,
      profileImage: user.profileImage
    };

    await Donor.findOneAndUpdate(
      { user: req.user._id },
      { $set: donorUpdates },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return sendResponse(res, 200, true, 'Profile updated', { user });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};


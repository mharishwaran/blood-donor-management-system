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
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    if (!user) return sendResponse(res, 404, false, 'User not found');

    await Donor.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          user: req.user._id,
          name: updates.name || user.name,
          bloodGroup: updates.bloodGroup || user.bloodGroup,
          department: updates.department || user.department,
          year: updates.year || user.year,
          city: updates.city || user.city,
          phone: updates.phone || user.phone,
          dateOfBirth: user.dateOfBirth,
          availability: updates.availability ?? user.availability,
          lastDonationDate: updates.lastDonationDate || user.lastDonationDate,
          profileImage: updates.profileImage || user.profileImage
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return sendResponse(res, 200, true, 'Profile updated', { user });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};


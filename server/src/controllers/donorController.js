import Donor from '../models/Donor.js';
import User from '../models/User.js';
import redis from '../config/redis.js';
import { sendResponse } from '../utils/response.js';

const normalizeDonorBody = (body, user) => ({
  user: user._id,
  name: String(body.name || user.name || '').trim(),
  bloodGroup: String(body.bloodGroup || user.bloodGroup || '').trim().toUpperCase(),
  department: String(body.department || user.department || '').trim(),
  year: String(body.year || user.year || '').trim(),
  city: String(body.city || user.city || '').trim(),
  phone: String(body.phone || user.phone || '').replace(/\D/g, ''),
  availability: body.availability ?? user.availability ?? true,
  lastDonationDate: body.lastDonationDate || user.lastDonationDate,
  profileImage: String(body.profileImage || user.profileImage || '').trim()
});

const isValidDonorPayload = (payload) => payload.name && payload.bloodGroup && payload.phone;

export const createDonor = async (req, res) => {
  try {
    const payload = normalizeDonorBody(req.body, req.user);

    if (!isValidDonorPayload(payload)) {
      return sendResponse(res, 400, false, 'Name, blood group, and phone number are required');
    }

    const donor = await Donor.create(payload);

    await User.findByIdAndUpdate(req.user._id, {
      bloodGroup: donor.bloodGroup,
      department: donor.department,
      year: donor.year,
      city: donor.city,
      phone: donor.phone,
      availability: donor.availability,
      lastDonationDate: donor.lastDonationDate,
      profileImage: donor.profileImage
    });

    await redis.del('donors:all');
    return sendResponse(res, 201, true, 'Donor created', donor);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const getDonors = async (req, res) => {
  try {
    const { bloodGroup, location, page = 1, limit = 10, sort = '-createdAt' } = req.query;
    const cacheKey = `donors:${bloodGroup || 'all'}:${location || 'all'}:${page}:${limit}`;
    const cached = await redis.get(cacheKey);

    if (cached) return sendResponse(res, 200, true, 'Donors fetched from cache', JSON.parse(cached));

    const filter = {};
    if (bloodGroup) filter.bloodGroup = bloodGroup.toUpperCase();
    if (location) filter.city = new RegExp(location, 'i');

    const [donors, total] = await Promise.all([
      Donor.find(filter)
        .sort(sort)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean(),
      Donor.countDocuments(filter)
    ]);

    const result = { donors, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 120);
    return sendResponse(res, 200, true, 'Donors fetched', result);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const updateDonor = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return sendResponse(res, 404, false, 'Donor not found');
    if (String(donor.user) !== String(req.user._id) && req.user.role !== 'admin') {
      return sendResponse(res, 403, false, 'You can only update your own donor profile');
    }

    const updatePayload = {};
    if (req.body.name !== undefined) updatePayload.name = String(req.body.name).trim();
    if (req.body.bloodGroup !== undefined) updatePayload.bloodGroup = String(req.body.bloodGroup).trim().toUpperCase();
    if (req.body.department !== undefined) updatePayload.department = String(req.body.department).trim();
    if (req.body.year !== undefined) updatePayload.year = String(req.body.year).trim();
    if (req.body.city !== undefined) updatePayload.city = String(req.body.city).trim();
    if (req.body.phone !== undefined) updatePayload.phone = String(req.body.phone).replace(/\D/g, '');
    if (req.body.availability !== undefined) updatePayload.availability = req.body.availability;
    if (req.body.lastDonationDate !== undefined) updatePayload.lastDonationDate = req.body.lastDonationDate;
    if (req.body.profileImage !== undefined) updatePayload.profileImage = String(req.body.profileImage).trim();

    if (Object.keys(updatePayload).length === 0) {
      return sendResponse(res, 400, false, 'No valid fields provided for update');
    }

    const updatedDonor = await Donor.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true
    });

    await redis.del('donors:all');
    return sendResponse(res, 200, true, 'Donor updated', updatedDonor);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const deleteDonor = async (req, res) => {
  try {
    const donor = await Donor.findByIdAndDelete(req.params.id);
    if (!donor) return sendResponse(res, 404, false, 'Donor not found');
    await redis.del('donors:all');
    return sendResponse(res, 200, true, 'Donor deleted');
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

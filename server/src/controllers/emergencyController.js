import EmergencyRequest from '../models/EmergencyRequest.js';
import Donor from '../models/Donor.js';
import { addNotificationJob } from '../jobs/notificationQueue.js';
import { sendResponse } from '../utils/response.js';

const normalizeEmergencyBody = (body) => ({
  hospital: String(body.hospital || '').trim(),
  patient: String(body.patient || '').trim(),
  phoneNumber: String(body.phoneNumber || '').replace(/\D/g, ''),
  bloodGroup: String(body.bloodGroup || 'O+').trim().toUpperCase(),
  units: Number(body.units),
  location: String(body.location || '').trim(),
  urgency: String(body.urgency || 'high').trim().toLowerCase()
});

const isValidEmergencyPayload = (payload) => {
  return (
    payload.hospital &&
    payload.patient &&
    payload.phoneNumber.length === 10 &&
    payload.bloodGroup &&
    Number.isInteger(payload.units) &&
    payload.units > 0 &&
    payload.location &&
    ['low', 'medium', 'high'].includes(payload.urgency)
  );
};

export const createEmergencyRequest = async (req, res) => {
  try {
    const payload = normalizeEmergencyBody(req.body);
    payload.requestedBy = req.user._id;

    if (!isValidEmergencyPayload(payload)) {
      return sendResponse(res, 400, false, 'Invalid emergency request data');
    }

    const request = await EmergencyRequest.create(payload);
    const matchedDonors = await Donor.find({ bloodGroup: request.bloodGroup, availability: true }).limit(10);

    request.matchedDonors = matchedDonors.map((donor) => donor._id);
    request.status = 'active';
    request.history.push({ message: `Matched ${matchedDonors.length} donors` });
    await request.save();

    for (const donor of matchedDonors) {
      await addNotificationJob({
        userId: donor.user,
        title: 'Emergency blood request',
        message: `A ${request.bloodGroup} blood request is needed at ${request.hospital}`,
        email: req.user.email,
        type: 'emergency'
      });
    }

    return sendResponse(res, 201, true, 'Emergency request created', request);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const getEmergencyRequests = async (req, res) => {
  try {
    const requests = await EmergencyRequest.find()
      .populate('requestedBy', 'name email')
      .populate('matchedDonors', 'name phone city');
    return sendResponse(res, 200, true, 'Requests fetched', requests);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const updateEmergencyRequest = async (req, res) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) return sendResponse(res, 404, false, 'Request not found');

    if (String(request.requestedBy) !== String(req.user._id)) {
      return sendResponse(res, 403, false, 'You can only update your own emergency request');
    }

    const sanitized = normalizeEmergencyBody(req.body);
    const updatePayload = {};

    if ('hospital' in req.body) updatePayload.hospital = sanitized.hospital;
    if ('patient' in req.body) updatePayload.patient = sanitized.patient;
    if ('phoneNumber' in req.body) updatePayload.phoneNumber = sanitized.phoneNumber;
    if ('bloodGroup' in req.body) updatePayload.bloodGroup = sanitized.bloodGroup;
    if ('units' in req.body) updatePayload.units = sanitized.units;
    if ('location' in req.body) updatePayload.location = sanitized.location;
    if ('urgency' in req.body) updatePayload.urgency = sanitized.urgency;

    if (updatePayload.phoneNumber && updatePayload.phoneNumber.length !== 10) {
      return sendResponse(res, 400, false, 'Phone number must be exactly 10 digits');
    }

    if (Object.keys(updatePayload).length === 0) {
      return sendResponse(res, 400, false, 'No valid fields provided for update');
    }

    const updatedRequest = await EmergencyRequest.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true
    });
    return sendResponse(res, 200, true, 'Request updated', updatedRequest);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const deleteEmergencyRequest = async (req, res) => {
  try {
    const request = await EmergencyRequest.findById(req.params.id);
    if (!request) {
      return sendResponse(res, 404, false, 'Request not found');
    }

    if (String(request.requestedBy) !== String(req.user._id)) {
      return sendResponse(res, 403, false, 'You can only delete your own emergency request');
    }

    await request.deleteOne();
    return sendResponse(res, 200, true, 'Emergency request deleted');
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

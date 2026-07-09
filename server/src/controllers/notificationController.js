import Notification from '../models/Notification.js';
import { sendResponse } from '../utils/response.js';

export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort('-createdAt').lean();
    return sendResponse(res, 200, true, 'Notifications fetched', notifications);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return sendResponse(res, 404, false, 'Notification not found');
    }

    return sendResponse(res, 200, true, 'Notification marked as read', notification);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!notification) {
      return sendResponse(res, 404, false, 'Notification not found');
    }

    return sendResponse(res, 200, true, 'Notification deleted successfully');
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

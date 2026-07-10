import express from 'express';
import {
  adminLogin,
  adminLogout,
  adminDashboard,
  authorizeAdmin,
  getUsers,
  getDonors,
  updateDonorAvailability,
  updateUser,
  getUser,
  deleteUser,
  toggleUserBlock,
  getEmergencyRequests,
  updateEmergencyStatus,
  deleteEmergencyRequest,
  adminProfile,
  updateAdminProfile
} from '../controllers/adminController.js';
import { verifyAdmin } from '../middlewares/adminMiddleware.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', adminLogin);
router.post('/logout', adminLogout);
router.post('/authorize', protect, authorizeAdmin);
router.get('/dashboard', verifyAdmin, adminDashboard);
router.get('/users', verifyAdmin, getUsers);
router.get('/users/:id', verifyAdmin, getUser);
router.patch('/users/:id', verifyAdmin, updateUser);
router.delete('/users/:id', verifyAdmin, deleteUser);
router.patch('/users/:id/block', verifyAdmin, toggleUserBlock);
router.get('/donors', verifyAdmin, getDonors);
router.patch('/donors/:id/availability', verifyAdmin, updateDonorAvailability);
router.get('/emergency-requests', verifyAdmin, getEmergencyRequests);
router.patch('/emergency-requests/:id/status', verifyAdmin, updateEmergencyStatus);
router.delete('/emergency-requests/:id', verifyAdmin, deleteEmergencyRequest);
router.get('/profile', verifyAdmin, adminProfile);
router.put('/profile', verifyAdmin, updateAdminProfile);

export default router;

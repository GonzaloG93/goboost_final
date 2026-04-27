import express from 'express';
import { 
  getUserStats, 
  updateProfile, 
  getUsers, 
  updateUserRole 
} from '../controllers/userController.js';
import { auth, adminAuth } from '../middleware/authMiddleware.js'; // ✅ CORREGIDO

const router = express.Router();

router.get('/stats', auth, getUserStats);
router.put('/profile', auth, updateProfile);
router.get('/', adminAuth, getUsers);
router.patch('/:userId/role', adminAuth, updateUserRole);

export default router;
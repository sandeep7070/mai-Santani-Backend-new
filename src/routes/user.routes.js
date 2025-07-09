import Router from 'express';

import  {authenticate}  from '../middleware/userauth.middleware.js';
import { changePassword, deleteUser, forgotPassword, getAllUsers, getUserProfile, loginUser, logoutUser, refreshAccessToken, registerUser, resetPassword, updateUserProfile, updateUserRole } from '../controllers/user.controller.js';

const router = Router();

// Public routes
router.post('/register', registerUser);

router.post('/login', loginUser);

router.post('/forgot-password', forgotPassword);

router.put('/reset-password/:token', resetPassword);

router.post('/refresh-token', refreshAccessToken);

// Protected routes (require authentication)
router.use(authenticate);

router.post('/logout', logoutUser);

router.get('/profile', getUserProfile);

router.put('/profile', updateUserProfile);

router.put('/change-password', changePassword);

router.delete('/deleteById/:id', deleteUser);

// Admin-only routes
router.get('/getAllUsers', getAllUsers);

router.put('/:id/role', updateUserRole);

export default router;
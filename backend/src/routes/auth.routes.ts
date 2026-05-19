import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.post('/signup', authLimiter, asyncHandler(ctrl.signup));
router.post('/login', authLimiter, asyncHandler(ctrl.login));
router.post('/refresh', asyncHandler(ctrl.refresh));
router.post('/logout', asyncHandler(ctrl.logout));
router.post('/google', authLimiter, asyncHandler(ctrl.googleLogin));
router.post('/forgot-password', authLimiter, asyncHandler(ctrl.forgotPassword));
router.post('/reset-password', authLimiter, asyncHandler(ctrl.resetPassword));
router.get('/me', requireAuth, asyncHandler(ctrl.me));

export default router;

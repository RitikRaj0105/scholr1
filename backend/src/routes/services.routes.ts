import { Router } from 'express';
import * as ctrl from '../controllers/services.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

// Browse + search
router.get('/', asyncHandler(ctrl.searchServices));
router.get('/me', asyncHandler(ctrl.getMyServiceProfile));

// Own profile management
router.post('/me', asyncHandler(ctrl.upsertServiceProfile));
router.delete('/me', asyncHandler(ctrl.deleteServiceProfile));

// Provider detail (id-based, after /me to avoid conflict)
router.get('/:id', asyncHandler(ctrl.getServiceProfile));

// Reviews
router.post('/:id/reviews', asyncHandler(ctrl.submitReview));
router.delete('/reviews/:reviewId', asyncHandler(ctrl.deleteReview));

// Track contact (booking signal)
router.post('/:id/contact', asyncHandler(ctrl.recordContact));

export default router;

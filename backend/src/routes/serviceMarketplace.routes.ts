import { Router } from 'express';
import * as ctrl from '../controllers/serviceMarketplace.controller.js';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// ─── Provider profile (mine) ──────────────────────────────────
router.get('/me/profile', requireAuth, asyncHandler(ctrl.getMyProfile));
router.post('/me/profile', requireAuth, asyncHandler(ctrl.createOrUpdateProfile));
router.patch('/me/availability', requireAuth, asyncHandler(ctrl.updateAvailability));
router.post('/me/deactivate', requireAuth, asyncHandler(ctrl.deactivateMyProfile));

// ─── Discovery (any signed-in user can search) ────────────────
router.get('/providers', optionalAuth, asyncHandler(ctrl.listProviders));
router.get('/providers/:providerId', optionalAuth, asyncHandler(ctrl.getProviderPublic));

// ─── Favorites ────────────────────────────────────────────────
router.get('/favorites', requireAuth, asyncHandler(ctrl.listFavorites));
router.post('/favorites/:providerId', requireAuth, asyncHandler(ctrl.toggleFavorite));

// ─── Bookings ─────────────────────────────────────────────────
router.post('/bookings', requireAuth, asyncHandler(ctrl.createBooking));
router.get('/bookings', requireAuth, asyncHandler(ctrl.listMyBookings));
router.get('/bookings/:bookingId', requireAuth, asyncHandler(ctrl.getBooking));
router.post('/bookings/:bookingId/respond', requireAuth, asyncHandler(ctrl.respondToBooking));
router.post('/bookings/:bookingId/complete', requireAuth, asyncHandler(ctrl.completeBooking));
router.post('/bookings/:bookingId/cancel', requireAuth, asyncHandler(ctrl.cancelBooking));

// ─── Reviews ──────────────────────────────────────────────────
router.post('/reviews', requireAuth, asyncHandler(ctrl.createReview));
router.post('/reviews/:reviewId/reply', requireAuth, asyncHandler(ctrl.replyToReview));

// ─── Chat ─────────────────────────────────────────────────────
router.get('/chat/:bookingId', requireAuth, asyncHandler(ctrl.getChatForBooking));
router.post('/chat/:bookingId/messages', requireAuth, asyncHandler(ctrl.sendChatMessage));

// ─── Reports ──────────────────────────────────────────────────
router.post('/providers/:providerId/report', requireAuth, asyncHandler(ctrl.reportProvider));

// ─── Admin moderation ─────────────────────────────────────────
router.get(
  '/admin/reports',
  requireAuth,
  requireRole('SCHOOL_ADMIN', 'COLLEGE_ADMIN', 'SUPER_ADMIN'),
  asyncHandler(ctrl.adminListReports)
);
router.post(
  '/admin/reports/:reportId/review',
  requireAuth,
  requireRole('SCHOOL_ADMIN', 'COLLEGE_ADMIN', 'SUPER_ADMIN'),
  asyncHandler(ctrl.adminReviewReport)
);
router.post(
  '/admin/providers/:providerId/verify',
  requireAuth,
  requireRole('SCHOOL_ADMIN', 'COLLEGE_ADMIN', 'SUPER_ADMIN'),
  asyncHandler(ctrl.adminVerifyProvider)
);

export default router;

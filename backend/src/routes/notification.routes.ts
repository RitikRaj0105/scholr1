import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get('/', asyncHandler(ctrl.listNotifications));
router.get('/unread-count', asyncHandler(ctrl.unreadCount));
router.post('/mark-all-read', asyncHandler(ctrl.markAllRead));
router.post('/:id/read', asyncHandler(ctrl.markRead));
router.delete('/:id', asyncHandler(ctrl.deleteNotification));

export default router;

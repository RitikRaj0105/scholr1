import { Router } from 'express';
import * as ctrl from '../controllers/messages.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get('/conversations', asyncHandler(ctrl.listConversations));
router.get('/unread-count', asyncHandler(ctrl.unreadCount));
router.get('/:userId', asyncHandler(ctrl.getThread));
router.post('/:userId', asyncHandler(ctrl.sendMessage));
router.delete('/message/:id', asyncHandler(ctrl.deleteMessage));

export default router;

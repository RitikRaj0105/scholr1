import { Router } from 'express';
import * as ctrl from '../controllers/focus.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);

router.post('/sessions', asyncHandler(ctrl.startSession));
router.patch('/sessions/:id/end', asyncHandler(ctrl.endSession));
router.get('/sessions', asyncHandler(ctrl.listSessions));
router.get('/stats', asyncHandler(ctrl.stats));

export default router;

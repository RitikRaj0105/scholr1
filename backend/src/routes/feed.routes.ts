import { Router } from 'express';
import * as ctrl from '../controllers/feed.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get('/all', asyncHandler(ctrl.unifiedFeed));

export default router;

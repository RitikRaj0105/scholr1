import { Router } from 'express';
import * as ctrl from '../controllers/test.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);

router.get('/', asyncHandler(ctrl.listExams));
router.get('/stats', asyncHandler(ctrl.getStats));
router.get('/:id', asyncHandler(ctrl.getExam));
router.post('/generate', aiLimiter, asyncHandler(ctrl.generate));
router.post('/:id/submit', asyncHandler(ctrl.submit));

export default router;

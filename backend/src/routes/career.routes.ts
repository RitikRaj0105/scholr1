import { Router } from 'express';
import * as ctrl from '../controllers/career.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);

router.get('/profiles', asyncHandler(ctrl.listCareers));
router.get('/profiles/:slug', asyncHandler(ctrl.getCareer));

export default router;

import { Router } from 'express';
import * as ctrl from '../controllers/code.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);

router.get('/health', asyncHandler(ctrl.health));
router.get('/stats', asyncHandler(ctrl.getCodeStats));

router.get('/problems', asyncHandler(ctrl.listProblems));
router.get('/problems/:slug', asyncHandler(ctrl.getProblem));
router.post('/problems/:slug/run', asyncHandler(ctrl.runCode));
router.post('/problems/:slug/submit', asyncHandler(ctrl.submit));
router.get('/problems/:slug/submissions', asyncHandler(ctrl.listSubmissions));

router.get('/submissions/:submissionId', asyncHandler(ctrl.getSubmission));

export default router;

import { Router } from 'express';
import * as ctrl from '../controllers/jobs.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Public list + view
router.get('/', optionalAuth, asyncHandler(ctrl.listJobs));
router.get('/suggested', requireAuth, asyncHandler(ctrl.suggestedJobs));
router.get('/me/posted', requireAuth, asyncHandler(ctrl.myPostedJobs));
router.get('/me/applications', requireAuth, asyncHandler(ctrl.myApplications));
router.get('/:id', optionalAuth, asyncHandler(ctrl.getJob));
router.get('/:id/applications', requireAuth, asyncHandler(ctrl.jobApplications));

// Mutating
router.post('/', requireAuth, asyncHandler(ctrl.createJob));
router.post('/quick', requireAuth, asyncHandler(ctrl.quickPostJob));
router.patch('/:id', requireAuth, asyncHandler(ctrl.updateJob));
router.delete('/:id', requireAuth, asyncHandler(ctrl.deleteJob));
router.post('/:id/apply', requireAuth, asyncHandler(ctrl.applyToJob));

export default router;

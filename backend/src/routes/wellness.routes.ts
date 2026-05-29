import { Router } from 'express';
import * as ctrl from '../controllers/wellness.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Apply authentication middleware to all wellness routes
router.use(requireAuth);

router.get('/dashboard', asyncHandler(ctrl.getDashboard));
router.get('/study-intelligence', asyncHandler(ctrl.getStudyIntelligence));
router.get('/career', asyncHandler(ctrl.getCareerGuidance));
router.get('/recovery', asyncHandler(ctrl.getRecoveryMode));

router.get('/moods', asyncHandler(ctrl.moods));
router.post('/moods', asyncHandler(ctrl.logMood));
router.get('/insight', asyncHandler(ctrl.insight));

router.get('/journals', asyncHandler(ctrl.journals));
router.post('/journals', asyncHandler(ctrl.createJournal));
router.delete('/journals/:id', asyncHandler(ctrl.removeJournal));

router.get('/parent/permissions', asyncHandler(ctrl.getParentPermissions));
router.post('/parent/permissions', asyncHandler(ctrl.updateParentPermissions));
router.get('/parent/child/:studentId', asyncHandler(ctrl.getChildReportForParent));

router.get('/community/channels', asyncHandler(ctrl.getCommunityChannels));
router.get('/community/channels/:channelId/threads', asyncHandler(ctrl.getChannelThreads));
router.post('/community/channels/:channelId/threads', asyncHandler(ctrl.createThread));
router.get('/community/threads/:threadId', asyncHandler(ctrl.getThreadDetails));
router.post('/community/threads/:threadId/comments', asyncHandler(ctrl.createComment));

export default router;

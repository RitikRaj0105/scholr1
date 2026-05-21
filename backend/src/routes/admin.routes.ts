import { Router } from 'express';
import * as ctrl from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// All admin routes require authentication AND admin role
router.use(requireAuth);
router.use(requireRole('SCHOOL_ADMIN', 'COLLEGE_ADMIN', 'SUPER_ADMIN'));

// Stats
router.get('/stats', asyncHandler(ctrl.getStats));

// Coding problems CRUD
router.get('/problems', asyncHandler(ctrl.listProblems));
router.get('/problems/pending', asyncHandler(ctrl.listPendingProblems));
router.get('/problems/:slug', asyncHandler(ctrl.getProblem));
router.post('/problems', asyncHandler(ctrl.createProblem));
router.patch('/problems/:slug', asyncHandler(ctrl.updateProblem));
router.delete('/problems/:slug', asyncHandler(ctrl.deleteProblem));
router.post('/problems/:slug/approve', asyncHandler(ctrl.approveProblem));
router.post('/problems/:slug/reject', asyncHandler(ctrl.rejectProblem));

// User management
router.get('/users', asyncHandler(ctrl.listUsers));
router.patch('/users/:userId/role', asyncHandler(ctrl.setUserRole));
router.post('/users/:userId/suspend', asyncHandler(ctrl.suspendUser));
router.post('/users/:userId/unsuspend', asyncHandler(ctrl.unsuspendUser));

// Moderation — posts and reports
router.delete('/posts/:id', asyncHandler(ctrl.adminDeletePost));
router.get('/reports', asyncHandler(ctrl.listReports));
router.post('/reports/:id/review', asyncHandler(ctrl.reviewReport));

export default router;

import { Router } from 'express';
import * as ctrl from '../controllers/teacher.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);

// ─── Student-side endpoints (no teacher role required) ──
// These are for students to join/leave/list their enrollments
router.post('/classrooms/join', asyncHandler(ctrl.joinByCode));
router.get('/my-classrooms', asyncHandler(ctrl.myClassrooms));
router.delete('/enrollments/:enrollmentId', asyncHandler(ctrl.leaveClassroom));

// ─── Teacher-only endpoints from here ───────────────────
// Teachers and admins can manage classrooms
router.use(requireRole('TEACHER', 'SCHOOL_ADMIN', 'COLLEGE_ADMIN', 'SUPER_ADMIN'));

router.get('/stats', asyncHandler(ctrl.getTeacherStats));

router.get('/classrooms', asyncHandler(ctrl.listClassrooms));
router.get('/classrooms/:id', asyncHandler(ctrl.getClassroom));
router.post('/classrooms', asyncHandler(ctrl.createClassroom));
router.patch('/classrooms/:id', asyncHandler(ctrl.updateClassroom));
router.post('/classrooms/:id/regenerate-code', asyncHandler(ctrl.regenerateCode));
router.delete('/classrooms/:id', asyncHandler(ctrl.deleteClassroom));

router.delete('/students/:enrollmentId', asyncHandler(ctrl.removeStudent));

// Teacher coding problems
router.get('/problems', asyncHandler(ctrl.listMyProblems));
router.get('/problems/:slug', asyncHandler(ctrl.getMyProblem));
router.post('/problems', asyncHandler(ctrl.createMyProblem));
router.patch('/problems/:slug', asyncHandler(ctrl.updateMyProblem));

export default router;

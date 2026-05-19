import { Router } from 'express';
import * as ctrl from '../controllers/planner.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

// Tasks
router.get('/tasks', asyncHandler(ctrl.listTasks));
router.get('/tasks/today', asyncHandler(ctrl.listToday));
router.post('/tasks', asyncHandler(ctrl.createTask));
router.patch('/tasks/:id', asyncHandler(ctrl.updateTask));
router.post('/tasks/:id/toggle', asyncHandler(ctrl.toggleTask));
router.delete('/tasks/:id', asyncHandler(ctrl.deleteTask));

// Mood
router.get('/mood', asyncHandler(ctrl.listMood));
router.get('/mood/today', asyncHandler(ctrl.todayMood));
router.post('/mood', asyncHandler(ctrl.logMood));

// Upcoming exams & quote
router.get('/exams/upcoming', asyncHandler(ctrl.upcomingExams));
router.get('/quote', asyncHandler(ctrl.dailyQuote));

export default router;

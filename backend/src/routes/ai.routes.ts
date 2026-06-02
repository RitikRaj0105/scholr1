import { Router } from 'express';
import * as ctrl from '../controllers/ai.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(requireAuth);

router.get('/chats', asyncHandler(ctrl.listChats));
router.post('/chats', asyncHandler(ctrl.createChat));
router.get('/chats/:id', asyncHandler(ctrl.getChat));
router.delete('/chats/:id', asyncHandler(ctrl.deleteChat));
router.post('/chats/:id/messages', aiLimiter, asyncHandler(ctrl.sendMessage));

router.post('/explain', aiLimiter, asyncHandler(ctrl.explainTopicHandler));
router.post('/quiz', aiLimiter, asyncHandler(ctrl.generateQuizHandler));
router.post('/lesson-plan', aiLimiter, asyncHandler(ctrl.generateLessonPlanHandler));
router.post('/evaluate', aiLimiter, asyncHandler(ctrl.evaluateDescriptiveAnswerHandler));
router.get('/analytics', aiLimiter, asyncHandler(ctrl.getClassroomAIAnalyticsHandler));

export default router;

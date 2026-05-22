import { Router } from 'express';
import authRoutes from './auth.routes.js';
import aiRoutes from './ai.routes.js';
import focusRoutes from './focus.routes.js';
import testRoutes from './test.routes.js';
import codeRoutes from './code.routes.js';
import plannerRoutes from './planner.routes.js';
import adminRoutes from './admin.routes.js';
import teacherRoutes from './teacher.routes.js';
import careerRoutes from './career.routes.js';
import socialRoutes from './social.routes.js';
import notificationRoutes from './notification.routes.js';
import profileRoutes from './profile.routes.js';
import messagesRoutes from './messages.routes.js';
import jobsRoutes from './jobs.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'scholr-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);
router.use('/focus', focusRoutes);
router.use('/exams', testRoutes);
router.use('/code', codeRoutes);
router.use('/planner', plannerRoutes);
router.use('/admin', adminRoutes);
router.use('/teacher', teacherRoutes);
router.use('/career', careerRoutes);
router.use('/social', socialRoutes);
router.use('/notifications', notificationRoutes);
router.use('/profile', profileRoutes);
router.use('/messages', messagesRoutes);
router.use('/jobs', jobsRoutes);

export default router;

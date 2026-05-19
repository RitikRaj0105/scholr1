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

// Placeholder mount points — implement when needed:
// router.use('/classrooms', classroomRoutes);
// router.use('/assignments', assignmentRoutes);
// router.use('/jobs', jobRoutes);
// router.use('/notifications', notificationRoutes);

export default router;

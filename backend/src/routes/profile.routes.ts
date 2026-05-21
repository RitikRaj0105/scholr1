import { Router } from 'express';
import * as ctrl from '../controllers/profile.controller.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { uploadMiddleware, resumeUpload } from '../middleware/upload.js';

const router = Router();

// ─── Onboarding (multi-step signup) ──────────
router.post('/onboarding/step1', requireAuth, asyncHandler(ctrl.onboardStep1));
router.post('/onboarding/step2', requireAuth, asyncHandler(ctrl.onboardStep2));
router.post('/onboarding/step3', requireAuth, asyncHandler(ctrl.onboardStep3));

// ─── Profile reads (optionally authenticated) ─
router.get('/users/:userId', optionalAuth, asyncHandler(ctrl.getProfile));
router.get('/me', requireAuth, asyncHandler((req, res) => {
  req.params.userId = req.user!.id;
  return ctrl.getProfile(req, res);
}));

// ─── Profile updates ──────────────────────────
router.patch('/me', requireAuth, asyncHandler(ctrl.updateProfile));
router.patch('/me/profile-data', requireAuth, asyncHandler(ctrl.updateProfileData));
router.post('/me/banner', requireAuth, uploadMiddleware.single('image'), asyncHandler(ctrl.uploadBanner));
router.post('/me/resume', requireAuth, resumeUpload.single('resume'), asyncHandler(ctrl.uploadResume));

// ─── Education ────────────────────────────────
router.post('/me/education', requireAuth, asyncHandler(ctrl.addEducation));
router.patch('/me/education/:id', requireAuth, asyncHandler(ctrl.updateEducation));
router.delete('/me/education/:id', requireAuth, asyncHandler(ctrl.deleteEducation));

// ─── Work Experience ──────────────────────────
router.post('/me/experience', requireAuth, asyncHandler(ctrl.addExperience));
router.patch('/me/experience/:id', requireAuth, asyncHandler(ctrl.updateExperience));
router.delete('/me/experience/:id', requireAuth, asyncHandler(ctrl.deleteExperience));

// ─── Profile strength + AI ────────────────────
router.get('/me/strength', requireAuth, asyncHandler(ctrl.getStrength));
router.get('/me/ai-analysis', requireAuth, asyncHandler(ctrl.getAIAnalysis));

export default router;

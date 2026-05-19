import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/lifeSkillsService.js';

export const lessons = asyncHandler(async (req, res) => res.json({ lessons: await svc.lessons(req.query.category) }));
export const progress = asyncHandler(async (req, res) => res.json({ progress: await svc.myProgress(req.user.id) }));
export const complete = asyncHandler(async (req, res) => res.json({ progress: await svc.complete(req.user.id, req.params.id) }));

import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/careerService.js';

export const get = asyncHandler(async (req, res) => res.json({ profile: await svc.getProfile(req.user.id) }));
export const update = asyncHandler(async (req, res) => res.json({ profile: await svc.updateProfile(req.user.id, req.body) }));
export const recompute = asyncHandler(async (req, res) => res.json({ profile: await svc.recompute(req.user.id) }));

import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/studyPlanService.js';

export const list = asyncHandler(async (req, res) => res.json({ plans: await svc.list(req.user.id) }));
export const get = asyncHandler(async (req, res) => res.json({ plan: await svc.get(req.user.id, req.params.id) }));
export const create = asyncHandler(async (req, res) => res.status(201).json({ plan: await svc.create(req.user.id, req.body) }));
export const updateProgress = asyncHandler(async (req, res) => res.json({ plan: await svc.updateProgress(req.user.id, req.params.id) }));
export const remove = asyncHandler(async (req, res) => res.json(await svc.remove(req.user.id, req.params.id)));

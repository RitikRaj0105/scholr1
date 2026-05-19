import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/examsService.js';

export const list = asyncHandler(async (req, res) => res.json({ exams: await svc.list(req.user.id) }));
export const upcoming = asyncHandler(async (req, res) => res.json({ exams: await svc.upcoming(req.user.id) }));
export const create = asyncHandler(async (req, res) => res.status(201).json({ exam: await svc.create(req.user.id, req.body) }));
export const update = asyncHandler(async (req, res) => res.json({ exam: await svc.update(req.user.id, req.params.id, req.body) }));
export const remove = asyncHandler(async (req, res) => res.json(await svc.remove(req.user.id, req.params.id)));

import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/wellnessService.js';

export const logMood = asyncHandler(async (req, res) => res.status(201).json({ log: await svc.logMood(req.user.id, req.body) }));
export const moods = asyncHandler(async (req, res) => res.json({ logs: await svc.listMoods(req.user.id) }));
export const insight = asyncHandler(async (req, res) => res.json(await svc.insight(req.user.id)));
export const journals = asyncHandler(async (req, res) => res.json({ entries: await svc.listJournals(req.user.id) }));
export const createJournal = asyncHandler(async (req, res) => res.status(201).json({ entry: await svc.createJournal(req.user.id, req.body) }));
export const removeJournal = asyncHandler(async (req, res) => res.json(await svc.removeJournal(req.user.id, req.params.id)));

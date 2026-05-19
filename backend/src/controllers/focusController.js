import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/focusService.js';

export const start = asyncHandler(async (req, res) => res.status(201).json({ session: await svc.startSession(req.user.id, req.body) }));
export const update = asyncHandler(async (req, res) => res.json({ session: await svc.updateSession(req.user.id, req.params.id, req.body) }));
export const list = asyncHandler(async (req, res) => res.json({ sessions: await svc.list(req.user.id) }));
export const analytics = asyncHandler(async (req, res) => res.json(await svc.analytics(req.user.id)));
export const listBlocked = asyncHandler(async (req, res) => res.json({ sites: await svc.listBlocked(req.user.id) }));
export const addBlocked = asyncHandler(async (req, res) => res.status(201).json({ site: await svc.addBlocked(req.user.id, req.body) }));
export const removeBlocked = asyncHandler(async (req, res) => res.json(await svc.removeBlocked(req.user.id, req.params.id)));
export const recordHit = asyncHandler(async (req, res) => res.status(201).json({ hit: await svc.recordHit(req.user.id, req.body.focusSessionId, req.body.domain) }));
export const seedDefaults = asyncHandler(async (req, res) => res.json({ sites: await svc.seedDefaults(req.user.id) }));

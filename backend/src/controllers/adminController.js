import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/adminService.js';

export const stats = asyncHandler(async (_req, res) => res.json(await svc.stats()));
export const users = asyncHandler(async (req, res) => res.json({ users: await svc.listUsers(req.query) }));
export const setRole = asyncHandler(async (req, res) => res.json({ user: await svc.setUserRole(req.params.id, req.body.role) }));
export const toggleActive = asyncHandler(async (req, res) => res.json({ user: await svc.toggleActive(req.params.id, req.body.isActive) }));
export const moderate = asyncHandler(async (req, res) => res.json({ item: await svc.moderateListing(req.params.id, req.body.approved) }));

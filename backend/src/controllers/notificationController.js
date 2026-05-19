import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/notificationService.js';

export const list = asyncHandler(async (req, res) => res.json({ notifications: await svc.list(req.user.id), unread: await svc.unread(req.user.id) }));
export const markRead = asyncHandler(async (req, res) => res.json(await svc.markRead(req.user.id, req.params.id)));
export const markAllRead = asyncHandler(async (req, res) => res.json(await svc.markAllRead(req.user.id)));

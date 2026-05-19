import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/productivityService.js';

export const last30 = asyncHandler(async (req, res) => res.json({ logs: await svc.last30(req.user.id) }));
export const streaks = asyncHandler(async (req, res) => res.json(await svc.streaks(req.user.id)));

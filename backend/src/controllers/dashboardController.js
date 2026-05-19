import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/dashboardService.js';

export const overview = asyncHandler(async (req, res) => res.json(await svc.overview(req.user.id)));

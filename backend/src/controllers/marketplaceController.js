import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/marketplaceService.js';

export const list = asyncHandler(async (req, res) => res.json({ items: await svc.list(req.query) }));
export const get = asyncHandler(async (req, res) => res.json({ item: await svc.get(req.params.id) }));
export const create = asyncHandler(async (req, res) => res.status(201).json({ item: await svc.create(req.user.id, req.body) }));
export const update = asyncHandler(async (req, res) => res.json({ item: await svc.update(req.user.id, req.params.id, req.body) }));
export const remove = asyncHandler(async (req, res) => res.json(await svc.remove(req.user.id, req.params.id)));
export const review = asyncHandler(async (req, res) => res.status(201).json({ review: await svc.review(req.user.id, req.params.id, req.body) }));

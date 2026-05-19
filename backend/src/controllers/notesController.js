import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/notesService.js';

export const list = asyncHandler(async (req, res) => res.json({ notes: await svc.list(req.user.id, req.query) }));
export const create = asyncHandler(async (req, res) => res.status(201).json({ note: await svc.create(req.user.id, req.body) }));
export const update = asyncHandler(async (req, res) => res.json({ note: await svc.update(req.user.id, req.params.id, req.body) }));
export const remove = asyncHandler(async (req, res) => res.json(await svc.remove(req.user.id, req.params.id)));

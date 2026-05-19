import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/taskService.js';

export const list = asyncHandler(async (req, res) =>
  res.json({ tasks: await svc.list(req.user.id, req.query) }));
export const create = asyncHandler(async (req, res) =>
  res.status(201).json({ task: await svc.create(req.user.id, req.body) }));
export const update = asyncHandler(async (req, res) =>
  res.json({ task: await svc.update(req.user.id, req.params.id, req.body) }));
export const remove = asyncHandler(async (req, res) =>
  res.json(await svc.remove(req.user.id, req.params.id)));
export const summary = asyncHandler(async (req, res) =>
  res.json(await svc.summary(req.user.id)));

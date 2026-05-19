import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/userService.js';

export const getMe = asyncHandler(async (req, res) => {
  const user = await svc.getProfile(req.user.id);
  res.json({ user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await svc.updateProfile(req.user.id, req.body);
  res.json({ user });
});

export const getPrefs = asyncHandler(async (req, res) => {
  res.json({ preferences: await svc.getPreferences(req.user.id) });
});

export const updatePrefs = asyncHandler(async (req, res) => {
  res.json({ preferences: await svc.updatePreferences(req.user.id, req.body) });
});

export const search = asyncHandler(async (req, res) => {
  res.json({ users: await svc.searchUsers(req.query.q || '') });
});

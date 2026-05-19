import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/aiChatService.js';

export const listChats = asyncHandler(async (req, res) => res.json({ chats: await svc.listChats(req.user.id) }));
export const getChat = asyncHandler(async (req, res) => res.json({ chat: await svc.getChat(req.user.id, req.params.id) }));
export const sendMessage = asyncHandler(async (req, res) => res.json(await svc.sendMessage(req.user.id, req.body)));
export const removeChat = asyncHandler(async (req, res) => res.json(await svc.removeChat(req.user.id, req.params.id)));

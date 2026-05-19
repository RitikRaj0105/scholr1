import { asyncHandler } from '../utils/asyncHandler.js';
import * as svc from '../services/socialService.js';

export const listRooms = asyncHandler(async (req, res) => res.json({ rooms: await svc.listRooms(req.user.id) }));
export const createRoom = asyncHandler(async (req, res) => res.status(201).json({ room: await svc.createRoom(req.user.id, req.body) }));
export const joinRoom = asyncHandler(async (req, res) => res.json({ membership: await svc.joinRoom(req.user.id, req.params.id) }));
export const leaveRoom = asyncHandler(async (req, res) => res.json(await svc.leaveRoom(req.user.id, req.params.id)));
export const roomMessages = asyncHandler(async (req, res) => res.json({ messages: await svc.roomMessages(req.params.id) }));
export const sendRoomMessage = asyncHandler(async (req, res) => {
  const io = req.app.get('io');
  res.status(201).json({ message: await svc.sendRoomMessage(req.user.id, req.params.id, req.body.content, io) });
});

export const sendFriendRequest = asyncHandler(async (req, res) => res.status(201).json({ request: await svc.sendFriendRequest(req.user.id, req.body.userId) }));
export const respondFriend = asyncHandler(async (req, res) => res.json({ friendship: await svc.respondFriend(req.user.id, req.params.id, req.body.accept) }));
export const friendsList = asyncHandler(async (req, res) => res.json({ friends: await svc.friendsList(req.user.id) }));
export const friendRequests = asyncHandler(async (req, res) => res.json({ requests: await svc.friendRequests(req.user.id) }));

export const listChallenges = asyncHandler(async (req, res) => res.json({ challenges: await svc.listChallenges(req.user.id) }));
export const createChallenge = asyncHandler(async (req, res) => res.status(201).json({ challenge: await svc.createChallenge(req.user.id, req.body) }));
export const joinChallenge = asyncHandler(async (req, res) => res.status(201).json({ entry: await svc.joinChallenge(req.user.id, req.params.id) }));

export const leaderboard = asyncHandler(async (req, res) => res.json({ entries: await svc.leaderboard(req.query.scope || 'global') }));

import { Router } from 'express';
import * as ctl from '../controllers/socialController.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { studyRoomSchema, messageSchema, friendActionSchema, challengeSchema } from '../validators/index.js';

const r = Router();
r.use(authRequired);

// Rooms
r.get('/rooms', ctl.listRooms);
r.post('/rooms', validate(studyRoomSchema), ctl.createRoom);
r.post('/rooms/:id/join', ctl.joinRoom);
r.post('/rooms/:id/leave', ctl.leaveRoom);
r.get('/rooms/:id/messages', ctl.roomMessages);
r.post('/rooms/:id/messages', validate(messageSchema), ctl.sendRoomMessage);

// Friends
r.get('/friends', ctl.friendsList);
r.get('/friends/requests', ctl.friendRequests);
r.post('/friends/request', validate(friendActionSchema), ctl.sendFriendRequest);
r.patch('/friends/requests/:id', ctl.respondFriend);

// Challenges
r.get('/challenges', ctl.listChallenges);
r.post('/challenges', validate(challengeSchema), ctl.createChallenge);
r.post('/challenges/:id/join', ctl.joinChallenge);

// Leaderboard
r.get('/leaderboard', ctl.leaderboard);

export default r;

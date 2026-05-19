import { Router } from 'express';
import * as ctl from '../controllers/aiController.js';
import { authRequired } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { aiChatSchema } from '../validators/index.js';

const r = Router();
r.use(authRequired);
r.get('/chats', ctl.listChats);
r.get('/chats/:id', ctl.getChat);
r.post('/chat', aiLimiter, validate(aiChatSchema), ctl.sendMessage);
r.delete('/chats/:id', ctl.removeChat);
export default r;

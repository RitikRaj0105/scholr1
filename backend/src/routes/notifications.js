import { Router } from 'express';
import * as ctl from '../controllers/notificationController.js';
import { authRequired } from '../middleware/auth.js';

const r = Router();
r.use(authRequired);
r.get('/', ctl.list);
r.post('/read-all', ctl.markAllRead);
r.post('/:id/read', ctl.markRead);
export default r;

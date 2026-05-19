import { Router } from 'express';
import * as ctl from '../controllers/lifeSkillsController.js';
import { authRequired } from '../middleware/auth.js';

const r = Router();
r.get('/lessons', ctl.lessons);
r.use(authRequired);
r.get('/progress', ctl.progress);
r.post('/lessons/:id/complete', ctl.complete);
export default r;

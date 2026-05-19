import { Router } from 'express';
import * as ctl from '../controllers/focusController.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { focusStartSchema, focusUpdateSchema, blockedSiteSchema } from '../validators/index.js';

const r = Router();
r.use(authRequired);

// Sessions
r.get('/sessions', ctl.list);
r.post('/sessions', validate(focusStartSchema), ctl.start);
r.patch('/sessions/:id', validate(focusUpdateSchema), ctl.update);
r.get('/analytics', ctl.analytics);
r.post('/hits', ctl.recordHit);

// Blocked sites
r.get('/blocked-sites', ctl.listBlocked);
r.post('/blocked-sites', validate(blockedSiteSchema), ctl.addBlocked);
r.delete('/blocked-sites/:id', ctl.removeBlocked);
r.post('/blocked-sites/seed', ctl.seedDefaults);

export default r;

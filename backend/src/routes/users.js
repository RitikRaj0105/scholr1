import { Router } from 'express';
import * as ctl from '../controllers/userController.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { profileUpdateSchema, preferencesSchema } from '../validators/index.js';

const r = Router();
r.use(authRequired);
r.get('/me', ctl.getMe);
r.patch('/me', validate(profileUpdateSchema), ctl.updateMe);
r.get('/preferences', ctl.getPrefs);
r.patch('/preferences', validate(preferencesSchema), ctl.updatePrefs);
r.get('/search', ctl.search);
export default r;

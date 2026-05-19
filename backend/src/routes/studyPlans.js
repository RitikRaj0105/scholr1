import { Router } from 'express';
import * as ctl from '../controllers/studyPlanController.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { studyPlanSchema } from '../validators/index.js';

const r = Router();
r.use(authRequired);
r.get('/', ctl.list);
r.get('/:id', ctl.get);
r.post('/', validate(studyPlanSchema), ctl.create);
r.post('/:id/recompute', ctl.updateProgress);
r.delete('/:id', ctl.remove);
export default r;

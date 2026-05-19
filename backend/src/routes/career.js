import { Router } from 'express';
import * as ctl from '../controllers/careerController.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { careerProfileSchema } from '../validators/index.js';

const r = Router();
r.use(authRequired);
r.get('/', ctl.get);
r.patch('/', validate(careerProfileSchema), ctl.update);
r.post('/recompute', aiLimiter, ctl.recompute);
export default r;

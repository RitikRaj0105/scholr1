import { Router } from 'express';
import * as ctl from '../controllers/examsController.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { examSchema } from '../validators/index.js';

const r = Router();
r.use(authRequired);
r.get('/', ctl.list);
r.get('/upcoming', ctl.upcoming);
r.post('/', validate(examSchema), ctl.create);
r.patch('/:id', validate(examSchema.partial()), ctl.update);
r.delete('/:id', ctl.remove);
export default r;

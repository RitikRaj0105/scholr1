import { Router } from 'express';
import * as ctl from '../controllers/taskController.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { taskSchema } from '../validators/index.js';

const r = Router();
r.use(authRequired);
r.get('/', ctl.list);
r.get('/summary', ctl.summary);
r.post('/', validate(taskSchema), ctl.create);
r.patch('/:id', validate(taskSchema.partial()), ctl.update);
r.delete('/:id', ctl.remove);
export default r;

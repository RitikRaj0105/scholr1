import { Router } from 'express';
import * as ctl from '../controllers/notesController.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { noteSchema } from '../validators/index.js';

const r = Router();
r.use(authRequired);
r.get('/', ctl.list);
r.post('/', validate(noteSchema), ctl.create);
r.patch('/:id', validate(noteSchema.partial()), ctl.update);
r.delete('/:id', ctl.remove);
export default r;

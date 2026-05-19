import { Router } from 'express';
import * as ctl from '../controllers/wellnessController.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { moodSchema, journalSchema } from '../validators/index.js';

const r = Router();
r.use(authRequired);
r.get('/moods', ctl.moods);
r.post('/moods', validate(moodSchema), ctl.logMood);
r.get('/insight', ctl.insight);
r.get('/journal', ctl.journals);
r.post('/journal', validate(journalSchema), ctl.createJournal);
r.delete('/journal/:id', ctl.removeJournal);
export default r;

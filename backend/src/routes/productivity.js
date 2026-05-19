import { Router } from 'express';
import * as ctl from '../controllers/productivityController.js';
import { authRequired } from '../middleware/auth.js';

const r = Router();
r.use(authRequired);
r.get('/logs', ctl.last30);
r.get('/streaks', ctl.streaks);
export default r;

import { Router } from 'express';
import * as ctl from '../controllers/dashboardController.js';
import { authRequired } from '../middleware/auth.js';

const r = Router();
r.use(authRequired);
r.get('/overview', ctl.overview);
export default r;

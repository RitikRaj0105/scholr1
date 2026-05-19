import { Router } from 'express';
import * as ctl from '../controllers/adminController.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const r = Router();
r.use(authRequired, requireRole('ADMIN'));
r.get('/stats', ctl.stats);
r.get('/users', ctl.users);
r.patch('/users/:id/role', ctl.setRole);
r.patch('/users/:id/active', ctl.toggleActive);
r.patch('/listings/:id/approve', ctl.moderate);
export default r;

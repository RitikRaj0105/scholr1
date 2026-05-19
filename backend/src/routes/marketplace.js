import { Router } from 'express';
import * as ctl from '../controllers/marketplaceController.js';
import { authRequired, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { listingSchema, reviewSchema } from '../validators/index.js';

const r = Router();
r.get('/', optionalAuth, ctl.list);
r.get('/:id', optionalAuth, ctl.get);
r.use(authRequired);
r.post('/', validate(listingSchema), ctl.create);
r.patch('/:id', validate(listingSchema.partial()), ctl.update);
r.delete('/:id', ctl.remove);
r.post('/:id/reviews', validate(reviewSchema), ctl.review);
export default r;

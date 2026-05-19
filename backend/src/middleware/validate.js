import { ApiError } from '../utils/ApiError.js';
import { sanitizeObject } from '../utils/sanitize.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  try {
    const data = sanitizeObject(req[source]);
    const parsed = schema.parse(data);
    req[source] = parsed;
    next();
  } catch (err) {
    next(ApiError.badRequest('Validation failed', err.errors || err.message));
  }
};

import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

export function notFound(_req, _res, next) {
  next(ApiError.notFound('Route not found'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) logger.error({ err: err.message, stack: err.stack, path: req.path });
  res.status(status).json({
    error: err.message || 'Internal server error',
    details: err.details,
    ...(process.env.NODE_ENV !== 'production' && status >= 500 ? { stack: err.stack } : {}),
  });
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code: string = 'HTTP_ERROR',
    public details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const BadRequest = (msg = 'Bad request', details?: unknown) =>
  new HttpError(400, msg, 'BAD_REQUEST', details);

export const Unauthorized = (msg = 'Unauthorized') =>
  new HttpError(401, msg, 'UNAUTHORIZED');

export const Forbidden = (msg = 'Forbidden') =>
  new HttpError(403, msg, 'FORBIDDEN');

export const NotFound = (msg = 'Not found') =>
  new HttpError(404, msg, 'NOT_FOUND');

export const Conflict = (msg = 'Conflict') =>
  new HttpError(409, msg, 'CONFLICT');

export const TooMany = (msg = 'Too many requests') =>
  new HttpError(429, msg, 'TOO_MANY_REQUESTS');

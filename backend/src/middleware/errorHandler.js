import { errorEnvelope } from '../utils/envelope.js';

export function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // Do not expose internal stacks in production
  let message = err.message || 'Internal server error';
  if (status === 500 && isProd) {
    message = 'An unexpected server error occurred. Please try again later.';
  }

  res.status(status).json(errorEnvelope(message, {
    statusCode: status,
    path: req.originalUrl
  }));
}

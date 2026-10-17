import { errorEnvelope } from '../utils/envelope.js';

const requestCounts = new Map();

/**
 * Lightweight sliding-window rate limiter
 * @param {number} maxRequests - Maximum requests permitted in window
 * @param {number} windowMs - Window duration in milliseconds (default 60s)
 */
export function rateLimit({ maxRequests = 60, windowMs = 60 * 1000 } = {}) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-client';
    const key = `${req.baseUrl || ''}${req.path}:${ip}`;
    const now = Date.now();

    const record = requestCounts.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count += 1;
    requestCounts.set(key, record);

    if (record.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json(
        errorEnvelope('Too many requests, please slow down.', {
          retryAfter: retryAfterSeconds
        })
      );
    }

    next();
  };
}

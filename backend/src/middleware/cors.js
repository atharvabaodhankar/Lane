import cors from 'cors';
import { env } from '../config/env.js';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow non-browser requests or matching origins
    if (!origin || env.ALLOWED_ORIGINS.includes('*') || env.ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'Idempotency-Key']
});

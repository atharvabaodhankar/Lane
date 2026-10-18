import express from 'express';
import { corsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';
import { errorEnvelope } from './utils/envelope.js';

import healthRoutes from './routes/health.js';
import configRoutes from './routes/config.js';
import completionsRoutes from './routes/completions.js';
import requestsRoutes from './routes/requests.js';
import statsRoutes from './routes/stats.js';
import authRoutes from './routes/auth.js';

const app = express();

// 1. CORS middleware first
app.use(corsMiddleware);

// 2. Request body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// 3. Mount routes
app.use('/api/health', healthRoutes);
app.use('/api/v1/config', configRoutes);
app.use('/api/v1/completions', completionsRoutes);
app.use('/api/v1/requests', requestsRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/auth', authRoutes);

// 4. Catch 404
app.use((req, res) => {
  res.status(404).json(errorEnvelope(`Endpoint not found: ${req.method} ${req.originalUrl}`));
});

// 5. Centralized error handling
app.use(errorHandler);

export default app;

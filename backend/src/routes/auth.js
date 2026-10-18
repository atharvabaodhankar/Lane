import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { successEnvelope, errorEnvelope } from '../utils/envelope.js';

const router = Router();

router.post('/login', rateLimit({ maxRequests: 10, windowMs: 60 * 1000 }), (req, res) => {
  const { password, tenantId = 'default-tenant' } = req.body || {};

  // Simple dev dashboard authentication
  // In production, verify against hashed password / AWS Cognito
  const defaultPassword = process.env.DASHBOARD_PASSWORD || 'lane-admin';

  if (password !== defaultPassword && process.env.NODE_ENV === 'production') {
    return res.status(401).json(errorEnvelope('Invalid password credentials.'));
  }

  const token = jwt.sign(
    {
      sub: 'dashboard-user',
      tenantId: tenantId || 'default-tenant',
      role: 'admin'
    },
    env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json(
    successEnvelope({
      token,
      expiresIn: 86400,
      tokenType: 'Bearer',
      tenantId
    })
  );
});

export default router;

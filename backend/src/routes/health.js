import { Router } from 'express';
import { env } from '../config/env.js';
import { successEnvelope } from '../utils/envelope.js';

const router = Router();
const startTime = Date.now();

router.get('/', (req, res) => {
  res.json(
    successEnvelope({
      status: 'healthy',
      uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
      region: env.AWS_REGION,
      mockServices: env.MOCK_SERVICES,
      timestamp: new Date().toISOString()
    })
  );
});

export default router;

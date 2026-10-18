import { Router } from 'express';
import { tiersConfig } from '../config/tiers.js';
import { successEnvelope } from '../utils/envelope.js';

const router = Router();

router.get('/', (req, res) => {
  res.json(
    successEnvelope({
      region: tiersConfig.region,
      tiers: tiersConfig.tiers,
      baselineTier: tiersConfig.baselineTier,
      fallbackTier: tiersConfig.fallbackTier,
      pricesAsOf: tiersConfig.pricesAsOf,
      cacheTtlSeconds: tiersConfig.cacheTtlSeconds,
      confidenceThreshold: tiersConfig.confidenceThreshold
    })
  );
});

export default router;

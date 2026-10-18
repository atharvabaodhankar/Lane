import { Router } from 'express';
import { calculateStats } from '../services/storage.js';
import { tiersConfig } from '../config/tiers.js';
import { successEnvelope } from '../utils/envelope.js';
import { authenticateDashboard } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticateDashboard, async (req, res, next) => {
  try {
    const tenantId = req.tenantId || 'default-tenant';
    const stats = await calculateStats(tenantId);

    res.json(
      successEnvelope({
        ...stats,
        pricesAsOf: tiersConfig.pricesAsOf,
        formula: 'savings = baselineCost (strong) - actualCost'
      })
    );
  } catch (err) {
    next(err);
  }
});

export default router;

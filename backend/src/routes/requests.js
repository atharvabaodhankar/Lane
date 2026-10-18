import { Router } from 'express';
import { queryRequests, getRequestById } from '../services/storage.js';
import { successEnvelope, errorEnvelope } from '../utils/envelope.js';
import { authenticateDashboard } from '../middleware/auth.js';

const router = Router();

// GET /api/v1/requests - list requests with cursor pagination
router.get('/', authenticateDashboard, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const cursor = req.query.cursor || null;
    const tenantId = req.tenantId || 'default-tenant';

    const result = await queryRequests(tenantId, { limit, cursor });
    res.json(successEnvelope(result.items, { nextCursor: result.nextCursor, count: result.items.length }));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/requests/:id - single request details
router.get('/:id', authenticateDashboard, async (req, res, next) => {
  try {
    const request = await getRequestById(req.params.id);
    if (!request) {
      return res.status(404).json(errorEnvelope('Request not found'));
    }
    res.json(successEnvelope(request));
  } catch (err) {
    next(err);
  }
});

export default router;

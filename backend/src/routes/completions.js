import { Router } from 'express';
import { z } from 'zod';
import { decideLane } from '../services/fastino.js';
import { invokeBedrock } from '../services/bedrock.js';
import { calculateCost, calculateCacheHitCost } from '../services/pricing.js';
import { getCacheItem, setCacheItem, logRequestRecord } from '../services/storage.js';
import { generateCacheKey, generateId, sha256 } from '../utils/hash.js';
import { successEnvelope, errorEnvelope } from '../utils/envelope.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { authenticateApiKey } from '../middleware/auth.js';

const router = Router();

const completionSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1, 'Message content cannot be empty')
      })
    )
    .min(1, 'At least one message is required'),
  system: z.string().optional(),
  maxTokens: z.number().int().positive().max(4096).optional(),
  forceLane: z.enum(['cheap', 'mid', 'strong', 'reject']).nullable().optional(),
  promptPreview: z.boolean().optional()
});

// Idempotency cache for duplicate request suppression
const idempotencyStore = new Map();

router.post(
  '/',
  rateLimit({ maxRequests: 60, windowMs: 60 * 1000 }),
  authenticateApiKey,
  async (req, res, next) => {
    const startTime = Date.now();

    // 1. Validate request body with Zod
    const validation = completionSchema.safeParse(req.body);
    if (!validation.success) {
      const issueMsg = validation.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      return res.status(400).json(errorEnvelope(`Validation error: ${issueMsg}`));
    }

    const { messages, system, maxTokens, forceLane, promptPreview } = validation.data;
    const idempotencyKey = req.headers['idempotency-key'];

    // Handle idempotency
    if (idempotencyKey) {
      const cachedResponse = idempotencyStore.get(idempotencyKey);
      if (cachedResponse) {
        return res.json(cachedResponse);
      }
    }

    try {
      // Find the last user message as the primary prompt
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      const promptText = lastUserMsg ? lastUserMsg.content : messages[0].content;
      const promptHash = sha256(promptText);

      // 2. Cache lookup (exact-match)
      const cacheKey = generateCacheKey(promptText, system || '', maxTokens || 512);
      const cached = await getCacheItem(cacheKey);

      if (cached && !forceLane) {
        const costData = calculateCacheHitCost(cached.usage?.inputTokens || 25, cached.usage?.outputTokens || 50);
        const responseData = {
          id: generateId(),
          answer: cached.answer,
          lane: cached.lane,
          modelId: cached.modelId,
          cacheHit: true,
          escalated: false,
          usage: cached.usage || { inputTokens: 25, outputTokens: 50 },
          cost: costData.cost,
          baselineCost: costData.baselineCost,
          savings: costData.savings,
          latencyMs: Date.now() - startTime,
          decision: {
            confidence: 1.0,
            reason: 'Answer served from cache; zero model inference cost.',
            source: 'cache'
          }
        };

        const resultEnvelope = successEnvelope(responseData);
        if (idempotencyKey) idempotencyStore.set(idempotencyKey, resultEnvelope);
        return res.json(resultEnvelope);
      }

      // 3. Fastino GLiDE routing decision
      const decision = await decideLane(promptText, { forceLane });

      // If routed to reject lane
      if (decision.lane === 'reject') {
        const rejectRecord = {
          id: generateId(),
          tenantId: req.tenantId || 'default-tenant',
          lane: 'reject',
          modelId: 'none',
          source: decision.source,
          confidence: decision.confidence,
          reason: decision.reason,
          inputTokens: 0,
          outputTokens: 0,
          cost: '0.0000000',
          baselineCost: '0.0000000',
          savings: '0.0000000',
          costNum: 0,
          baselineCostNum: 0,
          savingsNum: 0,
          latencyMs: Date.now() - startTime,
          cacheHit: false,
          escalated: false,
          promptHash,
          promptPreview: promptPreview ? promptText.slice(0, 120) : null,
          createdAt: new Date().toISOString()
        };
        await logRequestRecord(rejectRecord);

        return res.status(422).json(
          errorEnvelope(`Prompt rejected by safety guard: ${decision.reason}`, {
            lane: 'reject',
            reason: decision.reason,
            confidence: decision.confidence
          })
        );
      }

      // 4. Invoke Bedrock Converse API with chosen model
      const bedrockResult = await invokeBedrock(decision.lane, {
        messages,
        system,
        maxTokens
      });

      const effectiveLane = bedrockResult.effectiveLane || decision.lane;
      const escalated = !!bedrockResult.escalated;

      // 5. Cost accounting
      const costData = calculateCost(
        effectiveLane,
        bedrockResult.usage.inputTokens,
        bedrockResult.usage.outputTokens
      );

      const requestId = generateId();
      const latencyMs = Date.now() - startTime;

      // 6. Store in cache (if not escalated and valid answer)
      if (bedrockResult.answer && !escalated) {
        await setCacheItem(cacheKey, {
          answer: bedrockResult.answer,
          lane: effectiveLane,
          modelId: bedrockResult.modelId,
          usage: bedrockResult.usage
        });
      }

      // 7. Log request to DynamoDB
      const requestRecord = {
        id: requestId,
        tenantId: req.tenantId || 'default-tenant',
        lane: effectiveLane,
        modelId: bedrockResult.modelId,
        source: decision.source,
        confidence: decision.confidence,
        reason: decision.reason,
        inputTokens: bedrockResult.usage.inputTokens,
        outputTokens: bedrockResult.usage.outputTokens,
        cost: costData.cost,
        baselineCost: costData.baselineCost,
        savings: costData.savings,
        costNum: costData.costNum,
        baselineCostNum: costData.baselineCostNum,
        savingsNum: costData.savingsNum,
        latencyMs,
        cacheHit: false,
        escalated,
        promptHash,
        promptPreview: promptPreview ? promptText.slice(0, 120) : null,
        createdAt: new Date().toISOString()
      };
      await logRequestRecord(requestRecord);

      // 8. Build and send response
      const responseData = {
        id: requestId,
        answer: bedrockResult.answer,
        lane: effectiveLane,
        modelId: bedrockResult.modelId,
        cacheHit: false,
        escalated,
        usage: bedrockResult.usage,
        cost: costData.cost,
        baselineCost: costData.baselineCost,
        savings: costData.savings,
        latencyMs,
        decision: {
          confidence: decision.confidence,
          reason: decision.reason,
          source: decision.source
        }
      };

      const resultEnvelope = successEnvelope(responseData);
      if (idempotencyKey) idempotencyStore.set(idempotencyKey, resultEnvelope);
      return res.json(resultEnvelope);
    } catch (err) {
      next(err);
    }
  }
);

export default router;

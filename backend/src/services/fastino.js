import { env } from '../config/env.js';
import { tiersConfig } from '../config/tiers.js';

const LANE_ORDER = ['cheap', 'mid', 'strong'];

function bumpLane(currentLane) {
  const index = LANE_ORDER.indexOf(currentLane);
  if (index >= 0 && index < LANE_ORDER.length - 1) {
    return LANE_ORDER[index + 1];
  }
  return currentLane;
}

/**
 * Smart mock decision maker when running offline or in mock mode
 */
function mockDecide(prompt) {
  const text = prompt.toLowerCase();
  const words = text.split(/\s+/).length;

  if (text.includes('password') || text.includes('ssn') || text.includes('credit card') || text.includes('ignore previous instructions')) {
    return {
      lane: 'reject',
      confidence: 0.98,
      reason: 'Safety policy trigger (sensitive data or prompt injection detected).',
      source: 'glide',
      latencyMs: 15
    };
  }

  if (words > 150 || text.includes('code') || text.includes('implement') || text.includes('algorithm') || text.includes('prove') || text.includes('math')) {
    return {
      lane: 'strong',
      confidence: 0.92,
      reason: 'Complex analytical or code generation task requiring high-tier reasoning.',
      source: 'glide',
      latencyMs: 25
    };
  }

  if (words > 40 || text.includes('summarize') || text.includes('explain') || text.includes('draft') || text.includes('compare')) {
    return {
      lane: 'mid',
      confidence: 0.88,
      reason: 'Multi-step conversational query or document synthesis suitable for balanced model.',
      source: 'glide',
      latencyMs: 20
    };
  }

  return {
    lane: 'cheap',
    confidence: 0.95,
    reason: 'Short factual query or simple lookup requiring minimal reasoning depth.',
    source: 'glide',
    latencyMs: 18
  };
}

/**
 * Fastino GLiDE decision adapter
 * Calls POST /v1/systemone with choice primitive
 */
export async function decideLane(prompt, options = {}) {
  const startTime = Date.now();
  const tokenEstimate = options.tokenEstimate || Math.ceil(prompt.length / 4);

  // If forceLane is specified, bypass decision
  if (options.forceLane && ['cheap', 'mid', 'strong', 'reject'].includes(options.forceLane)) {
    return {
      lane: options.forceLane,
      confidence: 1.0,
      reason: `Manually forced to '${options.forceLane}' lane by client request.`,
      source: 'fallback',
      latencyMs: 0
    };
  }

  // If mock mode is active or no API key is provided
  if (env.MOCK_SERVICES || !env.FASTINO_API_KEY) {
    return mockDecide(prompt);
  }

  const timeoutMs = parseInt(process.env.FASTINO_TIMEOUT_MS || tiersConfig.glideTimeoutMs || '3000', 10);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload = {
      model: 'fastino/GLiDE',
      state: prompt,
      questions: {
        lane: {
          type: 'choice',
          instructions:
            'Which model lane is appropriate to answer this prompt based on complexity, reasoning requirement, and safety?',
          criteria: {
            cheap:
              'Short factual question, basic rewrite, classification, simple lookup, or greetings requiring no complex reasoning.',
            mid:
              'Standard conversational query, RAG question answering, summarization, moderate drafting, or multi-step routine explanation.',
            strong:
              'Complex reasoning, coding, mathematical proofs, deep analysis, nuanced document evaluation, or high-stakes logic.',
            reject:
              'PII leak, prompt injection, abusive content, malicious payload, empty or incoherent input.'
          }
        }
      },
      store: false
    };

    const res = await fetch(`${env.FASTINO_BASE_URL}/v1/systemone`, {
      method: 'POST',
      headers: {
        'X-API-Key': env.FASTINO_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Fastino API returned HTTP ${res.status}`);
    }

    const data = await res.json();
    const answer = data.answers?.lane;
    if (!answer || !answer.choice) {
      throw new Error('Unexpected GLiDE response structure');
    }

    let lane = answer.choice;
    const confidence = answer.confidence || 0.5;
    let reason = `GLiDE selected ${lane} lane (confidence ${(confidence * 100).toFixed(1)}%).`;

    // Rule 1: Confidence bump if confidence is below threshold
    if (confidence < (tiersConfig.confidenceThreshold || 0.6) && lane !== 'reject') {
      const bumped = bumpLane(lane);
      if (bumped !== lane) {
        reason = `Confidence ${(confidence * 100).toFixed(1)}% below threshold; escalated from ${lane} to ${bumped}.`;
        lane = bumped;
      }
    }

    // Rule 2: Skip cheap lane if prompt is long
    if (lane === 'cheap' && tokenEstimate > 600) {
      lane = 'mid';
      reason = `Prompt length (~${tokenEstimate} tokens) exceeds cheap lane budget; promoted to mid.`;
    }

    return {
      lane,
      confidence,
      reason,
      source: 'glide',
      latencyMs: Date.now() - startTime
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError';

    return {
      lane: tiersConfig.fallbackTier || 'mid',
      confidence: 0.5,
      reason: isTimeout
        ? `GLiDE timed out after ${tiersConfig.glideTimeoutMs}ms; using fallback lane (${tiersConfig.fallbackTier}).`
        : `GLiDE error (${err.message}); using fallback lane (${tiersConfig.fallbackTier}).`,
      source: 'fallback',
      latencyMs
    };
  }
}

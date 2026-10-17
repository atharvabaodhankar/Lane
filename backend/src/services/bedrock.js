import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { env } from '../config/env.js';
import { getTier, getFallbackTier } from '../config/tiers.js';

let client = null;

function getBedrockClient() {
  if (!client) {
    client = new BedrockRuntimeClient({
      region: env.AWS_REGION || 'us-east-1'
    });
  }
  return client;
}

const REFUSAL_PATTERNS = [
  /i cannot (fulfill|help with|assist with|answer) this request/i,
  /as an ai,? i am unable to/i,
  /i am not able to answer/i
];

function isRefusal(text) {
  return REFUSAL_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Mock response generator for local testing without AWS calls
 */
function mockConverse(lane, messages, systemPrompt) {
  const userText = messages[messages.length - 1]?.content?.[0]?.text || '';
  const tier = getTier(lane);

  const inputTokens = Math.max(10, Math.ceil((userText.length + (systemPrompt?.length || 0)) / 4));
  const outputTokens = Math.min(tier.maxTokens, Math.max(15, Math.ceil(userText.length / 3)));

  let answer = `[${tier.name}] Response to: "${userText.slice(0, 80)}${userText.length > 80 ? '...' : ''}"`;
  if (lane === 'cheap') {
    answer = `Here is the concise answer: ${userText.slice(0, 100)}`;
  } else if (lane === 'mid') {
    answer = `Summary & Answer:\nBased on your prompt, here is a clear explanation covering the key details.`;
  } else {
    answer = `Detailed Analysis & Solution:\n1. Problem breakdown\n2. In-depth reasoning and code considerations\n3. High-confidence conclusion.`;
  }

  return {
    answer,
    modelId: tier.modelId,
    usage: {
      inputTokens,
      outputTokens
    },
    stopReason: 'end_turn',
    escalated: false
  };
}

/**
 * Invoke Bedrock Converse API with retry/escalation from cheap to mid
 */
export async function invokeBedrock(lane, { messages, system, maxTokens }) {
  if (env.MOCK_SERVICES) {
    return mockConverse(lane, messages, system);
  }

  const primaryTier = getTier(lane);
  const bedrockClient = getBedrockClient();

  const formattedMessages = messages.map(msg => {
    if (Array.isArray(msg.content)) {
      return msg;
    }
    return {
      role: msg.role,
      content: [{ text: String(msg.content) }]
    };
  });

  const callModel = async (tierToCall) => {
    const commandInput = {
      modelId: tierToCall.modelId,
      messages: formattedMessages,
      inferenceConfig: {
        maxTokens: maxTokens || tierToCall.maxTokens,
        temperature: 0.7
      }
    };

    if (system && typeof system === 'string' && system.trim()) {
      commandInput.system = [{ text: system.trim() }];
    }

    const command = new ConverseCommand(commandInput);
    const response = await bedrockClient.send(command);

    const outputText = response.output?.message?.content?.[0]?.text || '';
    const stopReason = response.stopReason;
    const usage = {
      inputTokens: response.usage?.inputTokens || 0,
      outputTokens: response.usage?.outputTokens || 0
    };

    return {
      answer: outputText,
      modelId: tierToCall.modelId,
      usage,
      stopReason
    };
  };

  try {
    const result = await callModel(primaryTier);

    // Escalation check for cheap lane only:
    // If answer is empty or matches refusal, escalate once to mid tier
    if (lane === 'cheap') {
      const needsEscalation =
        !result.answer.trim() ||
        isRefusal(result.answer) ||
        (result.stopReason === 'max_tokens' && result.usage.outputTokens < 10);

      if (needsEscalation) {
        const midTier = getFallbackTier(); // 'mid'
        const escalatedResult = await callModel(midTier);
        return {
          ...escalatedResult,
          escalated: true,
          initialLane: 'cheap',
          effectiveLane: 'mid'
        };
      }
    }

    return {
      ...result,
      escalated: false,
      effectiveLane: lane
    };
  } catch (err) {
    // If cheap lane failed, retry once with fallback mid tier
    if (lane === 'cheap') {
      try {
        const midTier = getFallbackTier();
        const fallbackResult = await callModel(midTier);
        return {
          ...fallbackResult,
          escalated: true,
          initialLane: 'cheap',
          effectiveLane: 'mid'
        };
      } catch (fallbackErr) {
        throw new Error(`Bedrock invocation failed on both cheap and fallback tiers: ${fallbackErr.message}`);
      }
    }
    throw err;
  }
}

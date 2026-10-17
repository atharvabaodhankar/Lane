import crypto from 'crypto';

/**
 * Normalize prompt: lowercase, trimmed, whitespace collapsed
 */
export function normalizePrompt(prompt) {
  if (typeof prompt !== 'string') return '';
  return prompt
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Generates SHA-256 hash
 */
export function sha256(text) {
  return crypto.createHash('sha256').update(text || '', 'utf8').digest('hex');
}

/**
 * Generate unique cache key from prompt, system prompt, and parameters
 */
export function generateCacheKey(prompt, system = '', maxTokens = 512) {
  const normalized = normalizePrompt(prompt);
  const normalizedSystem = normalizePrompt(system);
  return sha256(`${normalized}::${normalizedSystem}::${maxTokens}`);
}

/**
 * Generates a clean prefixed ID like req_01H...
 */
export function generateId(prefix = 'req') {
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(6).toString('hex');
  return `${prefix}_${timestamp}${randomPart}`;
}

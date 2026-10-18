import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCost, calculateCacheHitCost } from '../src/services/pricing.js';
import { normalizePrompt, sha256, generateCacheKey } from '../src/utils/hash.js';
import { getTier, getBaselineTier, tiersConfig } from '../src/config/tiers.js';

describe('Pricing Engine & Cost Accounting', () => {
  test('Hand-calculated verification: cheap lane pricing', () => {
    // Nova Micro: input: $0.035 / 1M, output: $0.14 / 1M
    // Baseline Strong (Claude Sonnet 4.5): input: $3.00 / 1M, output: $15.00 / 1M
    // Tokens: 100 in, 200 out
    // actualCost = (100 * 0.035 + 200 * 0.14) / 1,000,000 = (3.5 + 28) / 1,000,000 = 31.5 / 1,000,000 = 0.0000315
    // baselineCost = (100 * 3.00 + 200 * 15.00) / 1,000,000 = (300 + 3000) / 1,000,000 = 3300 / 1,000,000 = 0.0033000
    // savings = 0.0033000 - 0.0000315 = 0.0032685

    const result = calculateCost('cheap', 100, 200);

    assert.equal(result.cost, '0.0000315');
    assert.equal(result.baselineCost, '0.0033000');
    assert.equal(result.savings, '0.0032685');
    assert.ok(Math.abs(result.costNum - 0.0000315) < 1e-10);
  });

  test('Hand-calculated verification: mid lane pricing', () => {
    // Claude Haiku: input: $0.25 / 1M, output: $1.25 / 1M
    // Tokens: 1000 in, 500 out
    // actualCost = (1000 * 0.25 + 500 * 1.25) / 1,000,000 = (250 + 625) / 1,000,000 = 875 / 1,000,000 = 0.0008750
    // baselineCost = (1000 * 3.00 + 500 * 15.00) / 1,000,000 = (3000 + 7500) / 1,000,000 = 10500 / 1,000,000 = 0.0105000
    // savings = 0.0105000 - 0.0008750 = 0.0096250

    const result = calculateCost('mid', 1000, 500);

    assert.equal(result.cost, '0.0008750');
    assert.equal(result.baselineCost, '0.0105000');
    assert.equal(result.savings, '0.0096250');
  });

  test('Hand-calculated verification: cache hit is zero actual cost', () => {
    const result = calculateCacheHitCost(100, 200);

    assert.equal(result.cost, '0.0000000');
    assert.equal(result.baselineCost, '0.0033000');
    assert.equal(result.savings, '0.0033000');
    assert.equal(result.costNum, 0);
  });
});

describe('Hashing and Prompt Normalization', () => {
  test('Normalizes prompt by collapsing whitespace and lowercasing', () => {
    const raw = '  What is   the capital  of France? \n\t';
    const normalized = normalizePrompt(raw);
    assert.equal(normalized, 'what is the capital of france?');
  });

  test('Produces consistent sha256 hashes regardless of trailing spaces', () => {
    const p1 = 'Summarize quantum mechanics.';
    const p2 = '   summarize   quantum mechanics.  ';

    const hash1 = sha256(normalizePrompt(p1));
    const hash2 = sha256(normalizePrompt(p2));

    assert.equal(hash1, hash2);
  });

  test('Generates reproducible cache keys with parameters', () => {
    const key1 = generateCacheKey('Hello world', 'You are an assistant', 512);
    const key2 = generateCacheKey('  hello  world  ', '  You are an assistant ', 512);
    assert.equal(key1, key2);
  });
});

describe('Tier Configuration', () => {
  test('Contains valid cheap, mid, and strong tiers', () => {
    const cheap = getTier('cheap');
    const mid = getTier('mid');
    const strong = getTier('strong');
    const baseline = getBaselineTier();

    assert.ok(cheap.modelId);
    assert.ok(mid.modelId);
    assert.ok(strong.modelId);
    assert.equal(baseline.name, strong.name);
    assert.ok(tiersConfig.pricesAsOf);
  });
});

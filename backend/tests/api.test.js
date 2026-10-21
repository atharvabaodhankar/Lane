import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { calculateCost, calculateCacheHitCost } from '../src/services/pricing.js';
import { normalizePrompt, sha256, generateCacheKey } from '../src/utils/hash.js';
import { getTier, getBaselineTier, tiersConfig } from '../src/config/tiers.js';

describe('Pricing Engine & Cost Accounting', () => {
  test('Hand-calculated verification: cheap lane pricing', () => {
    // Nova Micro: input: $0.035 / 1M, output: $0.14 / 1M
    // Baseline Strong (DeepSeek V3.2): input: $0.55 / 1M, output: $2.19 / 1M
    // Tokens: 100 in, 200 out
    // actualCost = (100 * 0.035 + 200 * 0.14) / 1,000,000 = (3.5 + 28) / 1,000,000 = 31.5 / 1,000,000 = 0.0000315
    // baselineCost = (100 * 0.55 + 200 * 2.19) / 1,000,000 = (55 + 438) / 1,000,000 = 493 / 1,000,000 = 0.0004930
    // savings = 0.0004930 - 0.0000315 = 0.0004615

    const result = calculateCost('cheap', 100, 200);

    assert.equal(result.cost, '0.0000315');
    assert.equal(result.baselineCost, '0.0004930');
    assert.equal(result.savings, '0.0004615');
    assert.ok(Math.abs(result.costNum - 0.0000315) < 1e-10);
  });

  test('Hand-calculated verification: mid lane pricing', () => {
    // Nova Lite: input: $0.06 / 1M, output: $0.24 / 1M
    // Baseline Strong (DeepSeek V3.2): input: $0.55 / 1M, output: $2.19 / 1M
    // Tokens: 1000 in, 500 out
    // actualCost = (1000 * 0.06 + 500 * 0.24) / 1,000,000 = (60 + 120) / 1,000,000 = 180 / 1,000,000 = 0.0001800
    // baselineCost = (1000 * 0.55 + 500 * 2.19) / 1,000,000 = (550 + 1095) / 1,000,000 = 1645 / 1,000,000 = 0.0016450
    // savings = 0.0016450 - 0.0001800 = 0.0014650

    const result = calculateCost('mid', 1000, 500);

    assert.equal(result.cost, '0.0001800');
    assert.equal(result.baselineCost, '0.0016450');
    assert.equal(result.savings, '0.0014650');
  });

  test('Hand-calculated verification: cache hit is zero actual cost', () => {
    const result = calculateCacheHitCost(100, 200);

    assert.equal(result.cost, '0.0000000');
    assert.equal(result.baselineCost, '0.0004930');
    assert.equal(result.savings, '0.0004930');
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

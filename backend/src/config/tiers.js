import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawData = fs.readFileSync(path.resolve(__dirname, 'tiers.json'), 'utf8');
export const tiersConfig = JSON.parse(rawData);

export function getTier(laneName) {
  const tier = tiersConfig.tiers[laneName];
  if (!tier) {
    throw new Error(`Unknown lane tier: ${laneName}`);
  }
  return tier;
}

export function getBaselineTier() {
  return getTier(tiersConfig.baselineTier);
}

export function getFallbackTier() {
  return getTier(tiersConfig.fallbackTier);
}

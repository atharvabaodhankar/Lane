import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try loading .env from backend/ or project root
const envPaths = [
  path.resolve(__dirname, '../../.env'), // backend/.env
  path.resolve(__dirname, '../../../../.env'), // root .env
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  FASTINO_API_KEY: process.env.FASTINO_API_KEY || '',
  FASTINO_BASE_URL: process.env.FASTINO_BASE_URL || 'https://api.fastino.ai',
  MOCK_SERVICES: process.env.MOCK_SERVICES === 'true',
  DYNAMODB_REQUESTS_TABLE: process.env.DYNAMODB_REQUESTS_TABLE || 'lane-requests-dev',
  DYNAMODB_CACHE_TABLE: process.env.DYNAMODB_CACHE_TABLE || 'lane-cache-dev',
  DYNAMODB_API_KEYS_TABLE: process.env.DYNAMODB_API_KEYS_TABLE || 'lane-api-keys-dev',
  JWT_SECRET: process.env.JWT_SECRET || 'lane-dev-secret-key-replace-in-production',
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map(s => s.trim())
};

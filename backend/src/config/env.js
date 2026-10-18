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
  get NODE_ENV() {
    return process.env.NODE_ENV || 'development';
  },
  get PORT() {
    return parseInt(process.env.PORT || '3000', 10);
  },
  get AWS_REGION() {
    return process.env.AWS_REGION || 'us-east-1';
  },
  get FASTINO_API_KEY() {
    return process.env.FASTINO_API_KEY || '';
  },
  get FASTINO_BASE_URL() {
    return process.env.FASTINO_BASE_URL || 'https://api.fastino.ai';
  },
  get MOCK_SERVICES() {
    return process.env.MOCK_SERVICES === 'true';
  },
  get DYNAMODB_REQUESTS_TABLE() {
    return process.env.DYNAMODB_REQUESTS_TABLE || 'lane-requests-dev';
  },
  get DYNAMODB_CACHE_TABLE() {
    return process.env.DYNAMODB_CACHE_TABLE || 'lane-cache-dev';
  },
  get DYNAMODB_API_KEYS_TABLE() {
    return process.env.DYNAMODB_API_KEYS_TABLE || 'lane-api-keys-dev';
  },
  get JWT_SECRET() {
    return process.env.JWT_SECRET || 'lane-dev-secret-key-replace-in-production';
  },
  get ALLOWED_ORIGINS() {
    return (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000')
      .split(',')
      .map(s => s.trim());
  }
};

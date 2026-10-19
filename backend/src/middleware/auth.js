import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { errorEnvelope } from '../utils/envelope.js';

export function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  // In local dev, allow requests without key or with test-api-key
  if (process.env.NODE_ENV !== 'production' && (!apiKey || apiKey === 'test-key')) {
    req.tenantId = 'default-tenant';
    req.apiKey = apiKey || 'dev-key';
    return next();
  }

  if (!apiKey) {
    return res.status(401).json(errorEnvelope('Missing x-api-key header.'));
  }

  // Set tenantId for downstream logging and storage
  req.tenantId = 'default-tenant';
  req.apiKey = apiKey;
  next();
}

export function authenticateDashboard(req, res, next) {
  const authHeader = req.headers['authorization'];
  const apiKey = req.headers['x-api-key'];

  // Check API key first
  if (apiKey) {
    req.tenantId = 'default-tenant';
    return next();
  }

  // Check Bearer token
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = decoded;
      req.tenantId = decoded.tenantId || 'default-tenant';
      return next();
    } catch {
      return res.status(401).json(errorEnvelope('Invalid or expired authentication token.'));
    }
  }

  // Allow in development mode if neither provided
  if (process.env.NODE_ENV !== 'production') {
    req.tenantId = 'default-tenant';
    return next();
  }

  return res.status(401).json(errorEnvelope('Authentication required.'));
}

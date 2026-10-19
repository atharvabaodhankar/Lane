import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { env } from '../config/env.js';

let docClient = null;

function getDocClient() {
  if (!docClient && !env.MOCK_SERVICES) {
    try {
      const rawClient = new DynamoDBClient({ region: env.AWS_REGION });
      docClient = DynamoDBDocumentClient.from(rawClient);
    } catch {
      docClient = null;
    }
  }
  return docClient;
}

// In-memory fallback stores for local testing without AWS calls
const memoryCache = new Map();
const memoryRequests = [];

/**
 * Cache operations
 */
export async function getCacheItem(key) {
  const now = Math.floor(Date.now() / 1000);

  // Check in-memory store first or if mock mode
  if (env.MOCK_SERVICES || !getDocClient()) {
    const item = memoryCache.get(key);
    if (!item) return null;
    if (item.ttl && item.ttl < now) {
      memoryCache.delete(key);
      return null;
    }
    return item;
  }

  try {
    const client = getDocClient();
    const res = await client.send(
      new GetCommand({
        TableName: env.DYNAMODB_CACHE_TABLE,
        Key: { key }
      })
    );
    if (res.Item && (!res.Item.ttl || res.Item.ttl >= now)) {
      return res.Item;
    }
    return null;
  } catch (err) {
    // Graceful fallback to memory on table not found or auth failure
    console.warn(`[Storage] DynamoDB cache get failed, using local memory: ${err.message}`);
    const item = memoryCache.get(key);
    if (item && (!item.ttl || item.ttl >= now)) return item;
    return null;
  }
}

export async function setCacheItem(key, data, ttlSeconds = 86400) {
  const ttl = Math.floor(Date.now() / 1000) + ttlSeconds;
  const item = { key, ...data, ttl };

  memoryCache.set(key, item);

  const client = getDocClient();
  if (!client || env.MOCK_SERVICES) return;

  try {
    await client.send(
      new PutCommand({
        TableName: env.DYNAMODB_CACHE_TABLE,
        Item: item
      })
    );
  } catch (err) {
    console.warn(`[Storage] DynamoDB cache write failed: ${err.message}`);
  }
}

/**
 * Request logging operations
 */
export async function logRequestRecord(record) {
  const item = {
    ...record,
    sk: `${record.createdAt}#${record.id}`
  };

  memoryRequests.unshift(item);
  // Keep memory bounded to last 500 records
  if (memoryRequests.length > 500) {
    memoryRequests.pop();
  }

  const client = getDocClient();
  if (!client || env.MOCK_SERVICES) return;

  try {
    await client.send(
      new PutCommand({
        TableName: env.DYNAMODB_REQUESTS_TABLE,
        Item: item
      })
    );
  } catch (err) {
    console.warn(`[Storage] DynamoDB request log write failed: ${err.message}`);
  }
}

/**
 * Query requests for dashboard with pagination
 */
export async function queryRequests(tenantId = 'default-tenant', { limit = 20, cursor = null } = {}) {
  // If memory mode or fallback
  if (env.MOCK_SERVICES || !getDocClient()) {
    let filtered = memoryRequests.filter(r => !tenantId || r.tenantId === tenantId || r.tenantId === 'dev-tenant');
    let startIndex = 0;
    if (cursor) {
      const idx = filtered.findIndex(r => r.id === cursor);
      if (idx >= 0) startIndex = idx + 1;
    }
    const items = filtered.slice(startIndex, startIndex + limit);
    const nextCursor = items.length === limit && startIndex + limit < filtered.length ? items[items.length - 1].id : null;
    return { items, nextCursor };
  }

  try {
    const client = getDocClient();
    const params = {
      TableName: env.DYNAMODB_REQUESTS_TABLE,
      KeyConditionExpression: 'tenantId = :tid',
      ExpressionAttributeValues: {
        ':tid': tenantId
      },
      ScanIndexForward: false, // Newest first
      Limit: limit
    };

    if (cursor) {
      params.ExclusiveStartKey = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'));
    }

    const res = await client.send(new QueryCommand(params));
    const nextCursor = res.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(res.LastEvaluatedKey)).toString('base64')
      : null;

    return {
      items: res.Items || [],
      nextCursor
    };
  } catch (err) {
    console.warn(`[Storage] DynamoDB query failed, returning local records: ${err.message}`);
    const items = memoryRequests.slice(0, limit);
    return { items, nextCursor: null };
  }
}

/**
 * Get request by ID
 */
export async function getRequestById(requestId) {
  const inMem = memoryRequests.find(r => r.id === requestId);
  if (inMem) return inMem;
  return null;
}

/**
 * Aggregate stats from requests
 */
export async function calculateStats(tenantId = 'default-tenant') {
  const records = memoryRequests.filter(
    r => !tenantId || r.tenantId === tenantId || r.tenantId === 'default-tenant' || r.tenantId === 'dev-tenant'
  );

  let totalCost = 0;
  let totalBaselineCost = 0;
  let totalSavings = 0;
  let totalRequests = records.length;
  let cacheHits = 0;

  const laneSplit = {
    cheap: 0,
    mid: 0,
    strong: 0,
    reject: 0
  };

  for (const r of records) {
    if (r.costNum !== undefined) totalCost += r.costNum;
    else totalCost += parseFloat(r.cost || 0);

    if (r.baselineCostNum !== undefined) totalBaselineCost += r.baselineCostNum;
    else totalBaselineCost += parseFloat(r.baselineCost || 0);

    if (r.savingsNum !== undefined) totalSavings += r.savingsNum;
    else totalSavings += parseFloat(r.savings || 0);

    if (r.cacheHit) cacheHits += 1;
    if (laneSplit[r.lane] !== undefined) {
      laneSplit[r.lane] += 1;
    }
  }

  const savingsPercent = totalBaselineCost > 0 ? ((totalSavings / totalBaselineCost) * 100).toFixed(1) : '0.0';

  return {
    totalRequests,
    cacheHits,
    totalCost: totalCost.toFixed(5),
    totalBaselineCost: totalBaselineCost.toFixed(5),
    totalSavings: totalSavings.toFixed(5),
    savingsPercent: `${savingsPercent}%`,
    laneSplit
  };
}

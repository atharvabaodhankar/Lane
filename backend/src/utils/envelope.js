/**
 * Standard API response envelope as specified in SYSTEM_DESIGN.md
 * Success: { success: true, data: ..., error: null, meta: {} }
 * Error:   { success: false, data: null, error: string, meta: {} }
 */

export function successEnvelope(data, meta = {}) {
  return {
    success: true,
    data,
    error: null,
    meta
  };
}

export function errorEnvelope(message, meta = {}) {
  return {
    success: false,
    data: null,
    error: typeof message === 'string' ? message : (message?.message || 'Unknown error'),
    meta
  };
}

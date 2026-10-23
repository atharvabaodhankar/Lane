/**
 * Currency conversion and formatting utilities
 * Fixed conversion rate: ~95 INR = 1 USD
 */

export const USD_TO_INR_RATE = 95;

/**
 * Formats an amount in USD into INR (₹)
 * 1 USD = 95 INR
 *
 * @param {number|string} usdAmount - The amount in USD
 * @param {object} [options]
 * @param {number} [options.precision]
 * @returns {string} e.g. "₹0.0015", "₹89.02"
 */
export function formatCost(usdAmount, options = {}) {
  const num = typeof usdAmount === 'number' ? usdAmount : parseFloat(usdAmount || 0);
  if (isNaN(num) || num === 0) return '₹0.0000';

  const inrValue = num * USD_TO_INR_RATE;

  if (options.precision !== undefined) {
    return `₹${inrValue.toFixed(options.precision)}`;
  }

  // Micro amounts (common in per-prompt LLM calls)
  if (inrValue < 0.001) {
    return `₹${inrValue.toFixed(5)}`;
  }
  if (inrValue < 0.1) {
    return `₹${inrValue.toFixed(4)}`;
  }
  if (inrValue < 10) {
    return `₹${inrValue.toFixed(3)}`;
  }
  return `₹${inrValue.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Format per 1M token pricing in INR
 * @param {number|string} usdRate 
 * @returns {string} e.g. "₹3.325"
 */
export function formatRatePer1M(usdRate) {
  const num = typeof usdRate === 'number' ? usdRate : parseFloat(usdRate || 0);
  const inr = num * USD_TO_INR_RATE;
  if (inr < 1) return `₹${inr.toFixed(3)}`;
  if (inr < 10) return `₹${inr.toFixed(2)}`;
  return `₹${inr.toFixed(2)}`;
}

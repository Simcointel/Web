/**
 * Shared formatting utilities
 * Consolidates duplicated fmt() functions across pages
 */

// ============================================================
// Number formatting
// ============================================================

/**
 * Formats a number with K/M/B suffixes
 * @param n - Number to format
 * @param prefix - Optional prefix (e.g., '$')
 * @returns Formatted string
 */
export function fmtNumber(n: number, prefix = ''): string {
  const a = Math.abs(n);
  if (a >= 1_000_000_000) return `${prefix}${(n / 1_000_000_000).toFixed(1)}B`;
  if (a >= 1_000_000) return `${prefix}${(n / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000) return `${prefix}${(n / 1_000).toFixed(1)}K`;
  return `${prefix}${n.toFixed(0)}`;
}

/**
 * Formats a number as currency with 2 decimal places
 * @param n - Number to format
 * @returns Formatted string with $ prefix
 */
export function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

/**
 * Formats a number with locale string and max 2 decimal places
 * @param n - Number to format
 * @returns Formatted string
 */
export function fmtLocale(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/**
 * Formats a number as integer with locale separators
 * @param n - Number to format
 * @returns Formatted string
 */
export function fmtInteger(n: number): string {
  return Math.round(n).toLocaleString();
}

/**
 * Formats a percentage
 * @param n - Percentage value (e.g., 87.6)
 * @param decimals - Decimal places
 * @returns Formatted string with % suffix
 */
export function fmtPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

/**
 * Formats a duration in days to human-readable string
 * @param days - Number of days
 * @returns Human-readable duration
 */
export function fmtDuration(days: number): string {
  if (days <= 1) return `${days} day`;
  if (days < 7) return `${days} days`;
  const w = Math.floor(days / 7);
  const d = days % 7;
  if (d === 0) return `${w} week${w > 1 ? 's' : ''}`;
  return `${w} week${w > 1 ? 's' : ''} ${d} day${d > 1 ? 's' : ''}`;
}

/**
 * Formats hours into human-readable string
 * @param hours - Number of hours
 * @returns Human-readable string
 */
export function fmtHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  const d = Math.floor(hours / 24);
  const h = Math.round(hours % 24);
  return h === 0 ? `${d}d` : `${d}d ${h}h`;
}

// ============================================================
// Data formatting helpers
// ============================================================

/**
 * Safely formats a potentially null/undefined number
 * @param n - Number or null/undefined
 * @param fallback - Fallback string
 * @param formatter - Formatter function
 * @returns Formatted string or fallback
 */
export function fmtSafe(n: number | null | undefined, fallback = '-', formatter = fmtNumber): string {
  if (n == null) return fallback;
  return formatter(n);
}

/**
 * Formats a VWAP price
 * @param price - Price value
 * @returns Formatted string with $ prefix
 */
export function fmtVWAP(price: number): string {
  return fmtCurrency(price);
}

/**
 * Formats profit/loss with sign
 * @param n - Profit value
 * @returns Formatted string with + prefix for positive
 */
export function fmtProfit(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${fmtCurrency(n)}`;
}

// ============================================================
// Re-export for backward compatibility
// ============================================================

// Default export for pages that use `fmt` as the main formatter
export { fmtNumber as fmt };
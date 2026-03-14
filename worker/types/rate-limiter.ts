export interface RateLimit {
  /** Max requests allowed per window. */
  limit: number;
  /** Window duration in ms (60_000 = 1 minute). */
  windowMs: number;
  /** Requests made in the current window. */
  count: number;
  /** Start of the current window. */
  windowStart: number;
}

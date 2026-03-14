export interface TokenBucket {
  tokens: number;
  maxTokens: number;
  refillRate: number; // tokens per ms
  lastRefill: number; // timestamp
}

/**
 * Lightweight in-memory sliding window rate limiter.
 * Protects against brute-force attacks, spamming, and database bombardment.
 */

type RateLimitRecord = {
  timestamps: number[];
};

class RateLimiter {
  private storage = new Map<string, RateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Periodically clean up stale IPs every 5 minutes to prevent memory leaks
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Check if a request from an identifier is allowed under a given limit within windowMs.
   */
  check(
    identifier: string,
    limit: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetInMs: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    const record = this.storage.get(identifier) ?? { timestamps: [] };

    // Filter out timestamps outside the sliding window
    const validTimestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (validTimestamps.length >= limit) {
      const oldestValid = validTimestamps[0];
      const resetInMs = Math.max(0, oldestValid + windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        resetInMs,
      };
    }

    validTimestamps.push(now);
    this.storage.set(identifier, { timestamps: validTimestamps });

    return {
      allowed: true,
      remaining: limit - validTimestamps.length,
      resetInMs: windowMs,
    };
  }

  private cleanup() {
    const now = Date.now();
    const maxWindow = 15 * 60 * 1000; // 15 minutes
    for (const [key, record] of this.storage.entries()) {
      const active = record.timestamps.some((ts) => now - ts < maxWindow);
      if (!active) {
        this.storage.delete(key);
      }
    }
  }
}

export const rateLimiter = new RateLimiter();

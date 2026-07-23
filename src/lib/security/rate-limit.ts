/**
 * Simple in-memory rate limiter (no external dependencies).
 * For production at scale, replace with Upstash Ratelimit.
 *
 * Red Team S1.4: prevents magic link enumeration attacks.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for a given key (e.g., IP address).
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { success: true, remaining: config.limit - 1, resetAt: now + config.windowMs }
  }

  if (entry.count >= config.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { success: true, remaining: config.limit - entry.count, resetAt: entry.resetAt }
}

/**
 * Rate limit configs for different endpoints.
 */
export const RATE_LIMITS = {
  // Magic link: 5 requests per minute per IP (S1.4)
  magicLink: { limit: 5, windowMs: 60 * 1000 },
  // API mutations: 30 per minute per user
  apiMutation: { limit: 30, windowMs: 60 * 1000 },
  // Webhook: 100 per minute (Lemon Squeezy retries)
  webhook: { limit: 100, windowMs: 60 * 1000 },
} as const

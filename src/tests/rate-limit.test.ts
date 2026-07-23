import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '@/lib/security/rate-limit'

/**
 * Red Team R3 — Test #10: Rate limiting
 * 6th request from same IP in 1 minute = blocked.
 */

describe('Rate Limiting', () => {
  it('Test #10: allows requests within limit', () => {
    const config = { limit: 5, windowMs: 60000 }
    const key = 'test-ip-allow-' + Date.now()

    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, config)
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4 - i)
    }
  })

  it('Test #10: blocks 6th request in same window', () => {
    const config = { limit: 5, windowMs: 60000 }
    const key = 'test-ip-block-' + Date.now()

    // Use up all 5 requests
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, config)
    }

    // 6th should be blocked
    const result = checkRateLimit(key, config)
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('Test #10: different keys have independent limits', () => {
    const config = { limit: 2, windowMs: 60000 }
    const key1 = 'ip-a-' + Date.now()
    const key2 = 'ip-b-' + Date.now()

    // Use up key1
    checkRateLimit(key1, config)
    checkRateLimit(key1, config)
    const blocked = checkRateLimit(key1, config)
    expect(blocked.success).toBe(false)

    // key2 should still work
    const allowed = checkRateLimit(key2, config)
    expect(allowed.success).toBe(true)
  })
})

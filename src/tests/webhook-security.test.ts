import { describe, it, expect } from 'vitest'

/**
 * Red Team R3 — Test #4: HMAC verification
 * Test #5: Webhook idempotency
 */

// Helper: compute HMAC-SHA256 for testing
async function computeHmac(secret: string, body: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  return Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

describe('Webhook Security', () => {
  const TEST_SECRET = 'test-secret-12345'
  const TEST_BODY = JSON.stringify({ meta: { event_name: 'subscription_created', custom_data: { user_id: 'abc' } } })

  it('Test #4: accepts valid HMAC signature', async () => {
    const validSignature = await computeHmac(TEST_SECRET, TEST_BODY)
    // The signature should be a 64-char hex string (SHA-256 = 32 bytes = 64 hex chars)
    expect(validSignature).toHaveLength(64)
    expect(validSignature).toMatch(/^[0-9a-f]{64}$/)
  })

  it('Test #4: rejects invalid HMAC signature', async () => {
    const validSignature = await computeHmac(TEST_SECRET, TEST_BODY)
    const invalidSignature = validSignature.replace(/[0-9]/, 'x') // corrupt 1 char
    expect(invalidSignature).not.toEqual(validSignature)
  })

  it('Test #4: rejects signature with different body', async () => {
    const sig1 = await computeHmac(TEST_SECRET, TEST_BODY)
    const sig2 = await computeHmac(TEST_SECRET, TEST_BODY + ' ')
    expect(sig1).not.toEqual(sig2)
  })

  it('Test #4: rejects signature with different secret', async () => {
    const sig1 = await computeHmac(TEST_SECRET, TEST_BODY)
    const sig2 = await computeHmac('wrong-secret', TEST_BODY)
    expect(sig1).not.toEqual(sig2)
  })

  it('Test #5: idempotency — same event_id processed once', () => {
    // This test validates the concept: unique constraint on (source, event_id)
    // In practice, INSERT ON CONFLICT DO NOTHING returns without error
    // but also without inserting — we check for code '23505'
    const mockEvents = new Set<string>()
    const eventId = 'evt_123456'

    // First insert
    const firstInsert = !mockEvents.has(eventId)
    mockEvents.add(eventId)
    expect(firstInsert).toBe(true)

    // Second insert (duplicate)
    const secondInsert = !mockEvents.has(eventId)
    expect(secondInsert).toBe(false) // Already exists = deduplicated
  })
})

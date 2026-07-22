/**
 * Lemon Squeezy integration helpers.
 * Uses the Lemon Squeezy API to create checkout URLs.
 *
 * Environment variables needed:
 * - LEMON_SQUEEZY_API_KEY: API key from Lemon Squeezy dashboard
 * - LEMON_SQUEEZY_STORE_ID: Store ID
 * - LEMON_SQUEEZY_VARIANT_ID: Product variant ID for Pro subscription
 * - LEMON_SQUEEZY_WEBHOOK_SECRET: Webhook signing secret
 */

const LS_API_BASE = 'https://api.lemonsqueezy.com/v1'

export async function createCheckoutUrl({
  userId,
  email,
  variantId,
}: {
  userId: string
  email: string
  variantId?: string
}) {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID
  const variant = variantId || process.env.LEMON_SQUEEZY_VARIANT_ID

  if (!apiKey || !storeId || !variant) {
    throw new Error('Lemon Squeezy env vars not configured')
  }

  const response = await fetch(`${LS_API_BASE}/checkouts`, {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email,
            custom: { user_id: userId },
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: storeId } },
          variant: { data: { type: 'variants', id: variant } },
        },
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Lemon Squeezy checkout error: ${err}`)
  }

  const json = await response.json()
  return json.data.attributes.url as string
}

/**
 * Verify webhook signature from Lemon Squeezy.
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET
  if (!secret) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  const expectedSignature = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return signature === expectedSignature
}

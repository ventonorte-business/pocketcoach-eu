import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Create admin client lazily (service_role key only available at runtime)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  )
}

/**
 * Verify webhook signature using timing-safe comparison (Red Team S1.2).
 * Reads raw body text, computes HMAC-SHA256, compares with crypto.timingSafeEqual.
 */
async function verifySignature(rawBody: string, signature: string): Promise<boolean> {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET
  if (!secret || !signature) return false

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
  const expectedHex = Array.from(new Uint8Array(signed))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // Timing-safe comparison (S1.2 fix)
  if (expectedHex.length !== signature.length) return false
  const a = encoder.encode(expectedHex)
  const b = encoder.encode(signature)
  // Use subtle comparison — both are same length guaranteed
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a[i] ^ b[i]
  }
  return mismatch === 0
}

export async function POST(request: Request) {
  // S1.2: Read raw body BEFORE any parsing
  const rawBody = await request.text()
  const signature = request.headers.get('x-signature') || ''

  // Verify HMAC signature (timing-safe)
  const isValid = await verifySignature(rawBody, signature)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const eventName: string = event.meta?.event_name || ''
  const userId: string = event.meta?.custom_data?.user_id || ''
  const eventId: string = event.meta?.webhook_id || event.data?.id || ''

  if (!userId) {
    return NextResponse.json({ error: 'No user_id in custom_data' }, { status: 400 })
  }

  const supabaseAdmin = getAdminClient()

  // S1.1: Idempotency check — prevent duplicate processing
  if (eventId) {
    const { error: insertError } = await supabaseAdmin
      .from('webhook_events')
      .insert({
        source: 'lemonsqueezy',
        event_id: eventId,
        event_name: eventName,
        payload: event,
      })

    if (insertError) {
      // If unique constraint violation → already processed, return 200 (idempotent)
      if (insertError.code === '23505') {
        return NextResponse.json({ received: true, deduplicated: true })
      }
      // Other DB error — log but continue processing
      console.error('[webhook] insert error:', insertError.message)
    }
  }

  // Process subscription events
  switch (eventName) {
    case 'subscription_created':
    case 'subscription_resumed':
    case 'subscription_unpaused': {
      await supabaseAdmin
        .from('profiles')
        .update({ is_pro: true })
        .eq('id', userId)
      break
    }

    case 'subscription_expired':
    case 'subscription_cancelled':
    case 'subscription_paused': {
      await supabaseAdmin
        .from('profiles')
        .update({ is_pro: false })
        .eq('id', userId)
      break
    }

    case 'subscription_updated': {
      const status = event.data?.attributes?.status
      const isPro = status === 'active' || status === 'on_trial'
      await supabaseAdmin
        .from('profiles')
        .update({ is_pro: isPro })
        .eq('id', userId)
      break
    }
  }

  return NextResponse.json({ received: true })
}

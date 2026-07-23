import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendDiscordAlert } from '@/lib/alerts/discord'
import {
  extractLemonSqueezyWebhookMeta,
  processLemonSqueezyWebhookEvent,
} from '@/lib/webhooks/lemonsqueezy'

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
    await sendDiscordAlert(
      'LemonSqueezy webhook rejected',
      'Invalid signature — possible tampering or replay',
      'warning',
      {
        event_name: request.headers.get('x-event-name') || 'unknown',
        signature_present: !!signature,
        ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
      },
    )
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch (err) {
    await sendDiscordAlert(
      'LemonSqueezy webhook parse failed',
      'Body was not valid JSON',
      'error',
      { error: String(err) },
    )
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { eventName, userId, eventId } = extractLemonSqueezyWebhookMeta(event)

  if (!userId) {
    await sendDiscordAlert(
      'LemonSqueezy webhook missing user_id',
      'custom_data.user_id is required',
      'warning',
      { event_name: eventName, event_id: eventId },
    )
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
        status: 'received',
      })

    if (insertError) {
      // If unique constraint violation → already processed, return 200 (idempotent)
      if (insertError.code === '23505') {
        return NextResponse.json({ received: true, deduplicated: true })
      }
      // Other DB error — log but continue processing
      console.error('[webhook] insert error:', insertError.message)
      await sendDiscordAlert(
        'LemonSqueezy webhook DB insert failed',
        insertError.message,
        'error',
        { event_name: eventName, event_id: eventId },
      )
    }
  }

  try {
    const result = await processLemonSqueezyWebhookEvent(supabaseAdmin, event, {
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    })

    if (eventId) {
      await supabaseAdmin
        .from('webhook_events')
        .update({ status: 'processed', last_error: null, processed_at: new Date().toISOString() })
        .eq('source', 'lemonsqueezy')
        .eq('event_id', eventId)
    }

    return NextResponse.json({ received: true, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (eventId) {
      await supabaseAdmin
        .from('webhook_events')
        .update({ status: 'failed', last_error: message })
        .eq('source', 'lemonsqueezy')
        .eq('event_id', eventId)
    }
    await sendDiscordAlert(
      'LemonSqueezy webhook processing failed',
      message,
      'error',
      { event_name: eventName, event_id: eventId, user_id: userId },
    )
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase/server'
import { sendDiscordAlert } from '@/lib/alerts/discord'
import { processLemonSqueezyWebhookEvent } from '@/lib/webhooks/lemonsqueezy'

export const dynamic = 'force-dynamic'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } },
  )
}

async function requireAdmin() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false as const, status: 401, user: null }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return { ok: false as const, status: 403, user }
  return { ok: true as const, user }
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: auth.status })
  }

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('webhook_events')
    .select('id, source, event_id, event_name, status, last_error, processed_at, reprocessed_at')
    .order('processed_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ events: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: auth.status })
  }

  const { id } = await request.json().catch(() => ({ id: null }))
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing event id' }, { status: 400 })
  }

  const admin = getAdminClient()
  const { data: eventRow, error: fetchError } = await admin
    .from('webhook_events')
    .select('id, source, event_id, event_name, payload')
    .eq('id', id)
    .single()

  if (fetchError || !eventRow) {
    return NextResponse.json({ error: fetchError?.message || 'Event not found' }, { status: 404 })
  }

  try {
    if (eventRow.source !== 'lemonsqueezy') {
      throw new Error(`Unsupported webhook source: ${eventRow.source}`)
    }

    const result = await processLemonSqueezyWebhookEvent(admin, eventRow.payload, {
      reprocess: true,
    })

    const { error: updateError } = await admin
      .from('webhook_events')
      .update({
        status: 'reprocessed',
        last_error: null,
        reprocessed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) throw new Error(updateError.message)

    return NextResponse.json({ ok: true, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await admin
      .from('webhook_events')
      .update({ status: 'failed', last_error: message })
      .eq('id', id)

    await sendDiscordAlert(
      'Webhook reprocess failed',
      message,
      'error',
      { source: eventRow.source, event_id: eventRow.event_id, event_name: eventRow.event_name },
    )

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
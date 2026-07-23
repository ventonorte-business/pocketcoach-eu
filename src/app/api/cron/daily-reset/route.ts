import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendDiscordAlert } from '@/lib/alerts/discord'

export const dynamic = 'force-dynamic'

/**
 * Daily reset cron job — called by Vercel Cron at 00:05 UTC daily.
 * Red Team P.3: Uses batch SQL function (no N+1 loop).
 * Scales to 10k+ users within 60s timeout.
 *
 * Red Team S12: Sends a Discord alert on failure so the on-call sees it.
 */
export async function GET(request: Request) {
  // Verify cron secret (prevent unauthorized triggers)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  )

  try {
    const { data, error } = await admin.rpc('daily_reset')

    if (error) {
      console.error('[cron/daily-reset] Error:', error.message)
      await sendDiscordAlert(
        'daily-reset cron failed',
        error.message,
        'error',
        { stage: 'rpc_daily_reset' },
      )
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('[cron/daily-reset] Success:', data)
    return NextResponse.json({ success: true, result: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[cron/daily-reset] Unexpected error:', message)
    await sendDiscordAlert(
      'daily-reset cron crashed',
      message,
      'error',
      { stage: 'unexpected' },
    )
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

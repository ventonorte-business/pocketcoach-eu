import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendDiscordAlert } from '@/lib/alerts/discord'

export const dynamic = 'force-dynamic'

/**
 * GDPR soft-delete purge cron (Red Team S9).
 * Permanently deletes accounts with profiles.deleted_at older than 30 days.
 *
 * NOTE: Supabase auth.users rows are still retained unless you also run an
 * auth-admin cleanup workflow. This route purges application data through the
 * database RPC, which cascades profile-owned tables.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } },
  )

  try {
    const { data, error } = await admin.rpc('purge_expired_soft_deleted')
    if (error) {
      await sendDiscordAlert('soft-delete purge failed', error.message, 'error')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, purged_profiles: data ?? 0 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await sendDiscordAlert('soft-delete purge crashed', message, 'error')
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GDPR Art. 17 — Right to erasure ("right to be forgotten")
 *
 * Soft-delete model (Red Team S9):
 *   1. Mark profiles.deleted_at = now() — user can't log in (middleware blocks).
 *   2. Keep all related rows for 30 days (undo window).
 *   3. A daily cron (`/api/cron/purge-soft-deleted` → RPC `purge_expired_soft_deleted`)
 *      hard-deletes accounts whose window expired.
 *
 *  Audit log (Red Team S6):
 *   Writes an `account_delete` row to `audit_log` via the service_role client.
 */
export async function DELETE(request: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Service-role client for writes that must bypass RLS (audit log + delete).
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  )

  // IP extraction (best effort — Vercel sets `x-forwarded-for`).
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null

  // 1. Mark profile as pending_deletion (sets deleted_at = now()).
  //    If the row was already soft-deleted (e.g. retry), this is idempotent.
  const { data: updated, error: softDeleteError } = await admin
    .from('profiles')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', user.id)
    .select('id, deleted_at')
    .single()

  if (softDeleteError) {
    return NextResponse.json(
      { error: 'Failed to mark account for deletion', details: softDeleteError.message },
      { status: 500 }
    )
  }

  // 2. Audit log — record who, what, when, from where.
  const { error: auditError } = await admin.from('audit_log').insert({
    user_id: user.id,
    action: 'account_delete',
    details: {
      soft_delete: true,
      purge_after_iso: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    ip,
  })

  if (auditError) {
    // Don't fail the user — log internally so we don't lose audit info silently.
    console.error('[account/delete] audit_log insert failed:', auditError.message)
  }

  // 3. Best-effort: kill active sessions. Optional, since middleware
  //    will refuse access on next request regardless.
  try {
    await admin.auth.admin.signOut(user.id, 'global')
  } catch (err) {
    console.error('[account/delete] signOut failed:', err)
  }

  return NextResponse.json({
    deleted: false, // soft delete
    pending_deletion: true,
    user_id: user.id,
    deleted_at: updated?.deleted_at,
    purge_after_days: 30,
  })
}
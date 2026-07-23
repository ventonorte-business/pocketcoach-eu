import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GDPR Art. 17 — Right to erasure ("right to be forgotten")
 * Deletes all user data across all 9 tables + auth account.
 */
export async function DELETE() {
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

  // Use admin client to bypass RLS for cascade delete
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  )

  // Delete in order respecting FK constraints (children first)
  // completions → habits (FK habit_id)
  await admin.from('completions').delete().eq('user_id', user.id)
  await admin.from('reflections').delete().eq('user_id', user.id)
  await admin.from('daily_quests').delete().eq('user_id', user.id)
  await admin.from('streak_log').delete().eq('user_id', user.id)
  await admin.from('boss_fights').delete().eq('user_id', user.id)
  await admin.from('guild_members').delete().eq('user_id', user.id)
  // Guilds where user is creator (cascade will remove members)
  await admin.from('guilds').delete().eq('created_by', user.id)
  await admin.from('habits').delete().eq('user_id', user.id)
  await admin.from('profiles').delete().eq('id', user.id)

  // Finally delete auth user
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    return NextResponse.json({ error: 'Failed to delete auth account' }, { status: 500 })
  }

  return NextResponse.json({ deleted: true, user_id: user.id })
}

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/**
 * GDPR Art. 20 — Right to data portability
 * Returns all user data as JSON download.
 */
export async function GET() {
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

  // Fetch all user data from all tables
  const [profile, habits, completions, streakLog, dailyQuests, guilds, guildMembers, bossFights, reflections] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('habits').select('*').eq('user_id', user.id),
    supabase.from('completions').select('*').eq('user_id', user.id),
    supabase.from('streak_log').select('*').eq('user_id', user.id),
    supabase.from('daily_quests').select('*').eq('user_id', user.id),
    supabase.from('guilds').select('*').eq('created_by', user.id),
    supabase.from('guild_members').select('*').eq('user_id', user.id),
    supabase.from('boss_fights').select('*').eq('user_id', user.id),
    supabase.from('reflections').select('*').eq('user_id', user.id),
  ])

  const exportData = {
    exported_at: new Date().toISOString(),
    user_id: user.id,
    email: user.email,
    profile: profile.data,
    habits: habits.data,
    completions: completions.data,
    streak_log: streakLog.data,
    daily_quests: dailyQuests.data,
    guilds_created: guilds.data,
    guild_memberships: guildMembers.data,
    boss_fights: bossFights.data,
    reflections: reflections.data,
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="pocketcoach-data-${user.id.slice(0, 8)}.json"`,
    },
  })
}

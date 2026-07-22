import { createClient } from '@/lib/supabase/client'
import { getSproutState } from './constants'

/**
 * Calculate and return streak info for the current user.
 * Called client-side after each completion to update UI immediately.
 */
export async function calculateStreak(userId: string) {
  const supabase = createClient()

  // Get streak_log ordered by date desc
  const { data: logs } = await supabase
    .from('streak_log')
    .select('log_date, all_habits_completed')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(30)

  if (!logs || logs.length === 0) {
    return { currentStreak: 0, longestStreak: 0, sproutState: 'wilting' as const }
  }

  // Count consecutive days from most recent where all_habits_completed = true
  let currentStreak = 0
  for (const log of logs) {
    if (log.all_habits_completed) {
      currentStreak++
    } else {
      break
    }
  }

  // Get longest streak from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('longest_streak')
    .eq('id', userId)
    .single()

  const longestStreak = Math.max(profile?.longest_streak ?? 0, currentStreak)
  const sproutState = getSproutState(currentStreak)

  return { currentStreak, longestStreak, sproutState }
}

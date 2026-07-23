'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

/**
 * Single-query hook that fetches ALL home dashboard data via RPC.
 * Red Team P.1: reduces 6-8 round-trips to 1.
 */
export function useDashboard() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.rpc('get_home_dashboard', {
        p_user_id: user.id,
      })

      if (error) throw error
      return data as {
        profile: {
          id: string
          display_name: string
          avatar_state: string
          total_xp: number
          current_streak: number
          longest_streak: number
          is_pro: boolean
        }
        habits: Array<{
          id: string
          title: string
          emoji: string
          frequency: string
        }>
        completions_today: Array<{
          id: string
          habit_id: string
          xp_earned: number
        }>
        streak_log_latest: {
          log_date: string
          all_habits_completed: boolean
          streak_day: number
        } | null
        daily_quest: {
          id: string
          quest_type: string
          quest_payload: Record<string, unknown>
          is_completed: boolean
          xp_reward: number
        } | null
        guild: {
          guild: { id: string; name: string; invite_code: string }
          members_count: number
        } | null
      }
    },
    staleTime: 10 * 1000, // 10s for dashboard (more fresh)
  })
}

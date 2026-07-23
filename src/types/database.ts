// PocketCoach EU — Database types (mirrors Supabase schema)

export interface Profile {
  id: string
  display_name: string
  avatar_state: 'sprout' | 'growing' | 'blooming' | 'wilting'
  total_xp: number
  current_streak: number
  longest_streak: number
  streak_updated_at: string | null
  timezone: string
  is_pro: boolean
  is_admin: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface Habit {
  id: string
  user_id: string
  title: string
  emoji: string
  frequency: 'daily' | 'weekdays' | 'custom'
  custom_days: number[]
  target_count: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface Completion {
  id: string
  habit_id: string
  user_id: string
  completed_at: string
  completed_date: string
  xp_earned: number
}

export interface StreakLog {
  id: string
  user_id: string
  log_date: string
  all_habits_completed: boolean
  habits_completed: number
  habits_total: number
  streak_day: number
}

export interface DailyQuest {
  id: string
  user_id: string
  quest_date: string
  quest_type: 'complete_all' | 'complete_n' | 'reflect' | 'boss_fight'
  quest_payload: Record<string, unknown>
  is_completed: boolean
  xp_reward: number
  completed_at: string | null
}

export interface Guild {
  id: string
  name: string
  invite_code: string
  created_by: string
  max_members: number
  created_at: string
}

export interface GuildMember {
  guild_id: string
  user_id: string
  joined_at: string
}

export interface BossFight {
  id: string
  guild_id: string | null
  user_id: string
  week_start: string
  target_completions: number
  current_completions: number
  is_defeated: boolean
  boss_name: string
  xp_reward: number
  created_at: string
}

export interface Reflection {
  id: string
  user_id: string
  reflection_date: string
  content: string
  xp_earned: number
  created_at: string
}

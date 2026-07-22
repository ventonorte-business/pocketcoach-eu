import { createClient } from '@/lib/supabase/client'
import { QUEST_TYPES, XP_PER_DAILY_QUEST } from './constants'
import type { QuestType } from './constants'

/**
 * Get today's quest for a user. If none exists, return null.
 */
export async function getTodayQuest(userId: string) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  const { data } = await supabase
    .from('daily_quests')
    .select('*')
    .eq('user_id', userId)
    .eq('quest_date', today)
    .single()

  return data
}

/**
 * Generate a daily quest for a user (called by cron or on-demand).
 */
export async function generateDailyQuest(userId: string) {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // Check if quest already exists
  const existing = await getTodayQuest(userId)
  if (existing) return existing

  // Pick random quest type
  const questType: QuestType = QUEST_TYPES[Math.floor(Math.random() * QUEST_TYPES.length)]

  let questPayload: Record<string, unknown> = {}

  if (questType === 'complete_n') {
    // Random target between 2 and 4
    questPayload = { target: Math.floor(Math.random() * 3) + 2 }
  }

  const { data } = await supabase
    .from('daily_quests')
    .insert({
      user_id: userId,
      quest_date: today,
      quest_type: questType,
      quest_payload: questPayload,
      xp_reward: XP_PER_DAILY_QUEST,
    })
    .select()
    .single()

  return data
}

/**
 * Complete a daily quest and reward XP.
 */
export async function completeDailyQuest(userId: string, questId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('daily_quests')
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq('id', questId)
    .eq('user_id', userId)
    .eq('is_completed', false) // prevent double-completion

  if (!error) {
    // Increment XP
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', userId)
      .single()

    if (profile) {
      await supabase
        .from('profiles')
        .update({ total_xp: profile.total_xp + XP_PER_DAILY_QUEST })
        .eq('id', userId)
    }
  }
}

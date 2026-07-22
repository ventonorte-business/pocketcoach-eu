import { createClient } from '@/lib/supabase/client'
import { XP_PER_LEVEL } from './constants'

/**
 * Get XP info for a user (total, level, progress to next level).
 */
export async function getXpInfo(userId: string) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('id', userId)
    .single()

  const totalXp = profile?.total_xp ?? 0
  const level = Math.floor(totalXp / XP_PER_LEVEL) + 1
  const currentLevelXp = totalXp % XP_PER_LEVEL

  return { totalXp, level, currentLevelXp, xpPerLevel: XP_PER_LEVEL }
}

/**
 * Increment XP for a user and return new total.
 */
export async function incrementXp(userId: string, amount: number) {
  const supabase = createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('total_xp')
    .eq('id', userId)
    .single()

  const newTotal = (profile?.total_xp ?? 0) + amount

  await supabase
    .from('profiles')
    .update({ total_xp: newTotal })
    .eq('id', userId)

  return newTotal
}

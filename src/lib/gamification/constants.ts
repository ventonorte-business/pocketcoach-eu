// Gamification constants for PocketCoach EU

export const XP_PER_COMPLETION = 10
export const XP_PER_REFLECTION = 15
export const XP_PER_DAILY_QUEST = 25
export const XP_PER_BOSS_FIGHT = 100
export const XP_PER_LEVEL = 100

// Sprout state thresholds (based on current_streak)
export const SPROUT_THRESHOLDS = {
  wilting: 0,    // streak = 0
  sprout: 1,     // streak 1-3
  growing: 4,    // streak 4-6
  blooming: 7,   // streak 7+
} as const

export type SproutState = 'wilting' | 'sprout' | 'growing' | 'blooming'

export function getSproutState(streak: number): SproutState {
  if (streak >= SPROUT_THRESHOLDS.blooming) return 'blooming'
  if (streak >= SPROUT_THRESHOLDS.growing) return 'growing'
  if (streak >= SPROUT_THRESHOLDS.sprout) return 'sprout'
  return 'wilting'
}

// Daily quest types
export const QUEST_TYPES = ['complete_all', 'complete_n', 'reflect'] as const
export type QuestType = typeof QUEST_TYPES[number]

// Boss fight names (rotate weekly)
export const BOSS_NAMES = [
  'Procrastination Dragon',
  'Distraction Hydra',
  'Comfort Zone Golem',
  'Excuse Phantom',
  'Snooze Kraken',
  'Scrolling Siren',
  'Overthinking Sphinx',
  'Burnout Phoenix',
  'Self-Doubt Shadow',
  'Chaos Gremlin',
] as const

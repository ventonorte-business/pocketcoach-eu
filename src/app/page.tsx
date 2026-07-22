'use client'

import { useState } from 'react'
import { Sprout } from '@/components/Sprout'
import { HabitCard } from '@/components/HabitCard'
import { StreakCounter } from '@/components/StreakCounter'
import { XpBar } from '@/components/XpBar'

// Demo data (will be replaced by Supabase queries)
const DEMO_HABITS = [
  { id: '1', title: 'Meditate 5 min', emoji: '🧘' },
  { id: '2', title: 'Read 10 pages', emoji: '📖' },
  { id: '3', title: 'Walk 2000 steps', emoji: '🚶' },
  { id: '4', title: 'Drink 2L water', emoji: '💧' },
  { id: '5', title: 'Journal 1 sentence', emoji: '✍️' },
]

export default function Home() {
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [xp, setXp] = useState(45)
  const streak = 4
  const longestStreak = 7

  function handleComplete(id: string) {
    setCompleted((prev) => new Set([...prev, id]))
    setXp((prev) => prev + 10)
  }

  const allDone = completed.size === DEMO_HABITS.length
  const sproutState = allDone
    ? 'blooming'
    : completed.size > 2
      ? 'growing'
      : completed.size === 0
        ? 'wilting'
        : 'sprout'

  const level = Math.floor(xp / 100) + 1
  const levelXp = 100
  const currentLevelXp = xp % 100

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">PocketCoach</h1>
        <StreakCounter streak={streak} longestStreak={longestStreak} />
      </div>

      {/* Mascot + XP */}
      <div className="flex flex-col items-center gap-3 py-4">
        <Sprout state={sproutState} streak={streak} />
        <div className="w-full max-w-xs">
          <XpBar currentXp={currentLevelXp} levelXp={levelXp} level={level} />
        </div>
      </div>

      {/* Daily Quest */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">⚡</span>
          <span className="font-semibold text-purple-800">Daily Quest</span>
        </div>
        <p className="text-sm text-purple-700">
          {allDone
            ? '✅ All habits completed! +25 XP bonus'
            : `Complete all ${DEMO_HABITS.length} habits today for +25 XP bonus`}
        </p>
      </div>

      {/* Habits list */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Today&apos;s habits ({completed.size}/{DEMO_HABITS.length})
        </h2>
        {DEMO_HABITS.map((habit) => (
          <HabitCard
            key={habit.id}
            id={habit.id}
            title={habit.title}
            emoji={habit.emoji}
            isCompleted={completed.has(habit.id)}
            onComplete={handleComplete}
          />
        ))}
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 pt-8">
        PocketCoach EU · Made with 🌱 for European minds
      </footer>
    </div>
  )
}

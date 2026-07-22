'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sprout } from '@/components/Sprout'
import { HabitCard } from '@/components/HabitCard'
import { StreakCounter } from '@/components/StreakCounter'
import { XpBar } from '@/components/XpBar'
import { useProfile } from '@/hooks/useProfile'
import { useHabits } from '@/hooks/useHabits'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()
  const { habits, loading: habitsLoading, completeHabit, isCompletedToday } = useHabits()
  const supabase = createClient()

  // Redirect to auth if not logged in
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/auth')
    }
    checkAuth()
  }, [router]) // eslint-disable-line react-hooks/exhaustive-deps

  if (profileLoading || habitsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-pulse text-2xl">🌱</div>
      </div>
    )
  }

  if (!profile) return null

  const completedCount = habits.filter((h) => isCompletedToday(h.id)).length
  const allDone = habits.length > 0 && completedCount === habits.length

  const sproutState = profile.avatar_state as 'sprout' | 'growing' | 'blooming' | 'wilting'
  const level = Math.floor(profile.total_xp / 100) + 1
  const currentLevelXp = profile.total_xp % 100

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">PocketCoach</h1>
          <p className="text-xs text-gray-500">
            Hi, {profile.display_name || 'there'} 👋
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StreakCounter streak={profile.current_streak} longestStreak={profile.longest_streak} />
          <button
            onClick={handleLogout}
            className="text-xs text-gray-400 hover:text-gray-600"
            title="Sign out"
          >
            ↗
          </button>
        </div>
      </div>

      {/* Mascot + XP */}
      <div className="flex flex-col items-center gap-3 py-4">
        <Sprout state={sproutState} streak={profile.current_streak} />
        <div className="w-full max-w-xs">
          <XpBar currentXp={currentLevelXp} levelXp={100} level={level} />
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
            : habits.length === 0
              ? 'Add your first habit to start earning XP!'
              : `Complete all ${habits.length} habits today for +25 XP bonus`}
        </p>
      </div>

      {/* Habits list */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Today&apos;s habits ({completedCount}/{habits.length})
          </h2>
          {habits.length < 3 && (
            <button
              onClick={() => router.push('/habits/new')}
              className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
            >
              + Add habit
            </button>
          )}
        </div>

        {habits.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-3xl mb-2">🌱</p>
            <p className="text-sm">No habits yet. Add your first one!</p>
          </div>
        ) : (
          habits.map((habit) => (
            <HabitCard
              key={habit.id}
              id={habit.id}
              title={habit.title}
              emoji={habit.emoji}
              isCompleted={isCompletedToday(habit.id)}
              onComplete={completeHabit}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-400 pt-8">
        PocketCoach EU · Made with 🌱 for European minds
      </footer>
    </div>
  )
}

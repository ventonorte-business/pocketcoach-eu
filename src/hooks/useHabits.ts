'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Habit, Completion } from '@/types/database'

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const today = new Date().toISOString().split('T')[0]

  const fetchHabits = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Fetch active habits
    const { data: habitsData } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: true })

    if (habitsData) setHabits(habitsData as Habit[])

    // Fetch today's completions
    const { data: completionsData } = await supabase
      .from('completions')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed_date', today)

    if (completionsData) setCompletions(completionsData as Completion[])
    setLoading(false)
  }, [today]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  async function createHabit(title: string, emoji: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('habits')
      .insert({ user_id: user.id, title, emoji })
      .select()
      .single()

    if (!error && data) {
      setHabits((prev) => [...prev, data as Habit])
      return data as Habit
    }
    return null
  }

  async function completeHabit(habitId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Check if already completed today
    const alreadyDone = completions.some(
      (c) => c.habit_id === habitId && c.completed_date === today
    )
    if (alreadyDone) return

    const { data, error } = await supabase
      .from('completions')
      .insert({
        habit_id: habitId,
        user_id: user.id,
        completed_date: today,
        xp_earned: 10,
      })
      .select()
      .single()

    if (!error && data) {
      setCompletions((prev) => [...prev, data as Completion])

      // Update total XP in profile (increment directly)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('id', user.id)
        .single()

      if (profileData) {
        await supabase
          .from('profiles')
          .update({ total_xp: (profileData.total_xp ?? 0) + 10 })
          .eq('id', user.id)
      }
    }
  }

  async function archiveHabit(habitId: string) {
    const { error } = await supabase
      .from('habits')
      .update({ is_archived: true })
      .eq('id', habitId)

    if (!error) {
      setHabits((prev) => prev.filter((h) => h.id !== habitId))
    }
  }

  function isCompletedToday(habitId: string): boolean {
    return completions.some(
      (c) => c.habit_id === habitId && c.completed_date === today
    )
  }

  return {
    habits,
    completions,
    loading,
    createHabit,
    completeHabit,
    archiveHabit,
    isCompletedToday,
    refresh: fetchHabits,
  }
}

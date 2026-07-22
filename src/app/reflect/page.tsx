'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { XP_PER_REFLECTION } from '@/lib/gamification/constants'

export default function ReflectPage() {
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [recentReflections, setRecentReflections] = useState<{ reflection_date: string; content: string }[]>([])
  const router = useRouter()
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if already reflected today
      const { data: existing } = await supabase
        .from('reflections')
        .select('*')
        .eq('user_id', user.id)
        .eq('reflection_date', today)
        .single()

      if (existing) {
        setAlreadyDone(true)
        setContent(existing.content)
      }

      // Fetch last 7 reflections
      const { data: recent } = await supabase
        .from('reflections')
        .select('reflection_date, content')
        .eq('user_id', user.id)
        .order('reflection_date', { ascending: false })
        .limit(7)

      if (recent) setRecentReflections(recent)
    }
    check()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || alreadyDone) return

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('reflections')
      .insert({
        user_id: user.id,
        reflection_date: today,
        content: content.trim(),
        xp_earned: XP_PER_REFLECTION,
      })

    if (!error) {
      // Increment XP
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('id', user.id)
        .single()

      if (profile) {
        await supabase
          .from('profiles')
          .update({ total_xp: profile.total_xp + XP_PER_REFLECTION })
          .eq('id', user.id)
      }

      setAlreadyDone(true)
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">✍️ Daily Reflection</h1>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ← Back
        </button>
      </div>

      {alreadyDone ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
          <p className="text-green-800 font-medium">✅ Reflection saved!</p>
          <p className="text-green-600 text-sm mt-1">+{XP_PER_REFLECTION} XP earned</p>
          <p className="text-gray-600 text-sm mt-3 italic">&ldquo;{content}&rdquo;</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <p className="text-sm text-gray-500">
            How did today go? Write 1 sentence for +{XP_PER_REFLECTION} XP.
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Today I felt..."
            maxLength={500}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400"
            autoFocus
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">{content.length}/500</span>
            <button
              type="submit"
              disabled={saving || !content.trim()}
              className="px-4 py-2 rounded-xl bg-purple-500 text-white font-medium text-sm hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save reflection'}
            </button>
          </div>
        </form>
      )}

      {/* Recent reflections */}
      {recentReflections.length > 0 && (
        <div className="mt-4">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Recent reflections
          </h2>
          <div className="flex flex-col gap-2">
            {recentReflections.map((r) => (
              <div
                key={r.reflection_date}
                className="bg-white border border-gray-100 rounded-xl p-3"
              >
                <p className="text-xs text-gray-400 mb-1">{r.reflection_date}</p>
                <p className="text-sm text-gray-700">{r.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

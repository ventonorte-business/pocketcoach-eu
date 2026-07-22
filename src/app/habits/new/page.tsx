'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const EMOJI_OPTIONS = ['🧘', '📖', '🚶', '💧', '✍️', '💪', '🎯', '🧠', '🌅', '🍎', '😴', '🎵']

export default function NewHabitPage() {
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('habits')
      .insert({ user_id: user.id, title: title.trim(), emoji })

    if (!error) {
      router.push('/')
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-6 min-h-[80vh] justify-center">
      <div className="text-center">
        <span className="text-4xl">{emoji}</span>
        <h1 className="text-xl font-bold mt-2">New Habit</h1>
        <p className="text-sm text-gray-500">What do you want to do every day?</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Meditate 5 min"
          required
          maxLength={60}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          autoFocus
        />

        {/* Emoji picker */}
        <div className="flex flex-wrap gap-2 justify-center">
          {EMOJI_OPTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                emoji === e
                  ? 'bg-green-100 ring-2 ring-green-400 scale-110'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="w-full px-4 py-3 rounded-xl bg-green-500 text-white font-medium text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Create habit'}
        </button>

        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-sm text-gray-400 hover:text-gray-600 text-center"
        >
          Cancel
        </button>
      </form>
    </div>
  )
}

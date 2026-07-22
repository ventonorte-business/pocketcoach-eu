'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGuild } from '@/hooks/useGuild'
import { BOSS_NAMES } from '@/lib/gamification/constants'

export default function GuildPage() {
  const { guild, bossFight, loading, createGuild, leaveGuild } = useGuild()
  const [newGuildName, setNewGuildName] = useState('')
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] animate-pulse text-2xl">⚔️</div>
  }

  // No guild yet — show create/join options
  if (!guild) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">⚔️ Guild</h1>
          <button onClick={() => router.push('/')} className="text-sm text-gray-400">← Back</button>
        </div>

        <div className="text-center py-8">
          <p className="text-gray-500 text-sm mb-4">Join a guild of 5 friends for weekly boss fights!</p>
        </div>

        {/* Create guild */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <h2 className="font-medium mb-2">Create a guild</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newGuildName}
              onChange={(e) => setNewGuildName(e.target.value)}
              placeholder="Guild name"
              maxLength={30}
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <button
              onClick={async () => {
                if (!newGuildName.trim()) return
                setCreating(true)
                await createGuild(newGuildName.trim())
                setCreating(false)
              }}
              disabled={creating || !newGuildName.trim()}
              className="px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 disabled:opacity-50"
            >
              {creating ? '...' : 'Create'}
            </button>
          </div>
        </div>

        {/* Join hint */}
        <p className="text-xs text-gray-400 text-center">
          Or ask a friend for their invite link: /guild/join/CODE
        </p>
      </div>
    )
  }

  // Has guild — show leaderboard + boss fight
  const sortedMembers = [...(guild.members || [])].sort(
    (a, b) => (b.profiles?.total_xp ?? 0) - (a.profiles?.total_xp ?? 0)
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">⚔️ {guild.name}</h1>
        <button onClick={() => router.push('/')} className="text-sm text-gray-400">← Back</button>
      </div>

      {/* Invite code */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">Invite code:</span>
        <button
          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/guild/join/${guild.invite_code}`)}
          className="text-sm font-mono bg-white px-3 py-1 rounded-lg border border-gray-200 hover:bg-gray-50"
        >
          {guild.invite_code} 📋
        </button>
      </div>

      {/* Boss fight */}
      {bossFight && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🐉</span>
            <span className="font-semibold text-red-800">{bossFight.boss_name}</span>
          </div>
          <div className="w-full h-3 bg-red-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 rounded-full transition-all"
              style={{ width: `${Math.min((bossFight.current_completions / bossFight.target_completions) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-red-600 mt-1">
            {bossFight.is_defeated
              ? `✅ Defeated! +${bossFight.xp_reward} XP`
              : `${bossFight.current_completions}/${bossFight.target_completions} hits`}
          </p>
        </div>
      )}

      {/* Leaderboard */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Leaderboard ({sortedMembers.length}/5)
        </h2>
        {sortedMembers.map((member, i) => (
          <div
            key={member.user_id}
            className={`flex items-center gap-3 p-3 rounded-xl border ${
              i === 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'
            }`}
          >
            <span className="text-lg font-bold text-gray-300 w-6">{i + 1}</span>
            <span className="flex-1 font-medium text-sm">
              {member.profiles?.display_name || 'Anonymous'}
              {i === 0 && ' 👑'}
            </span>
            <span className="text-xs text-gray-500">{member.profiles?.total_xp ?? 0} XP</span>
          </div>
        ))}
      </div>

      {/* Leave guild */}
      <button
        onClick={leaveGuild}
        className="text-xs text-red-400 hover:text-red-600 text-center mt-4"
      >
        Leave guild
      </button>
    </div>
  )
}

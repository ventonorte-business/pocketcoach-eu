'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Guild, GuildMember, BossFight } from '@/types/database'

interface GuildWithMembers extends Guild {
  members: (GuildMember & { profiles: { display_name: string; total_xp: number } })[]
}

export function useGuild() {
  const [guild, setGuild] = useState<GuildWithMembers | null>(null)
  const [bossFight, setBossFight] = useState<BossFight | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchGuild = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Find user's guild membership
    const { data: membership } = await supabase
      .from('guild_members')
      .select('guild_id')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (!membership) { setLoading(false); return }

    // Fetch guild with members + profiles
    const { data: guildData } = await supabase
      .from('guilds')
      .select('*')
      .eq('id', membership.guild_id)
      .single()

    if (!guildData) { setLoading(false); return }

    // Fetch members with profiles
    const { data: members } = await supabase
      .from('guild_members')
      .select('*, profiles(display_name, total_xp)')
      .eq('guild_id', guildData.id)

    setGuild({ ...guildData, members: members || [] } as unknown as GuildWithMembers)

    // Fetch current boss fight
    const thisMonday = getMonday(new Date()).toISOString().split('T')[0]
    const { data: boss } = await supabase
      .from('boss_fights')
      .select('*')
      .eq('guild_id', guildData.id)
      .eq('week_start', thisMonday)
      .single()

    if (boss) setBossFight(boss as BossFight)
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchGuild() }, [fetchGuild])

  async function createGuild(name: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: newGuild, error } = await supabase
      .from('guilds')
      .insert({ name, created_by: user.id })
      .select()
      .single()

    if (error || !newGuild) return null

    // Add creator as member
    await supabase
      .from('guild_members')
      .insert({ guild_id: newGuild.id, user_id: user.id })

    await fetchGuild()
    return newGuild
  }

  async function joinGuild(inviteCode: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Find guild by invite code
    const { data: targetGuild } = await supabase
      .from('guilds')
      .select('id, max_members')
      .eq('invite_code', inviteCode)
      .single()

    if (!targetGuild) return false

    // Check member count
    const { count } = await supabase
      .from('guild_members')
      .select('*', { count: 'exact', head: true })
      .eq('guild_id', targetGuild.id)

    if ((count ?? 0) >= targetGuild.max_members) return false

    const { error } = await supabase
      .from('guild_members')
      .insert({ guild_id: targetGuild.id, user_id: user.id })

    if (!error) {
      await fetchGuild()
      return true
    }
    return false
  }

  async function leaveGuild() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !guild) return

    await supabase
      .from('guild_members')
      .delete()
      .eq('guild_id', guild.id)
      .eq('user_id', user.id)

    setGuild(null)
    setBossFight(null)
  }

  return { guild, bossFight, loading, createGuild, joinGuild, leaveGuild, refresh: fetchGuild }
}

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

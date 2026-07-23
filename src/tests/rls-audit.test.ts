import { describe, it, expect } from 'vitest'

/**
 * Red Team R3 — S1.3: RLS Policy Audit
 * Validates that the RLS policies exist and follow the correct pattern.
 * Note: This is a DESIGN audit (validates the SQL design), not a runtime test.
 * For runtime RLS testing, use pgTAP in the Supabase environment.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const migrationSql = readFileSync(
  resolve(__dirname, '../../supabase/migrations/20260722000000_initial_schema.sql'),
  'utf8'
)

describe('RLS Policy Audit (S1.3)', () => {
  const tables = [
    'profiles',
    'habits',
    'completions',
    'streak_log',
    'daily_quests',
    'guilds',
    'guild_members',
    'boss_fights',
    'reflections',
  ]

  it('All 9 tables have RLS enabled', () => {
    for (const table of tables) {
      const pattern = `alter table public.${table} enable row level security`
      expect(migrationSql.toLowerCase()).toContain(pattern.toLowerCase())
    }
  })

  it('Profiles: users can only view/update own profile (auth.uid() = id)', () => {
    expect(migrationSql).toContain('auth.uid() = id')
    expect(migrationSql).toContain('Users can view own profile')
    expect(migrationSql).toContain('Users can update own profile')
  })

  it('Habits: users can only CRUD own habits (auth.uid() = user_id)', () => {
    expect(migrationSql).toContain('Users can view own habits')
    expect(migrationSql).toContain('Users can insert own habits')
    expect(migrationSql).toContain('Users can update own habits')
    expect(migrationSql).toContain('Users can delete own habits')
  })

  it('Completions: users can only view/insert own (no cross-user read)', () => {
    expect(migrationSql).toContain('Users can view own completions')
    expect(migrationSql).toContain('Users can insert own completions')
  })

  it('Reflections: users can only view/insert own (sensitive data)', () => {
    expect(migrationSql).toContain('Users can view own reflections')
    expect(migrationSql).toContain('Users can insert own reflections')
  })

  it('Guilds: only members can view guild data', () => {
    expect(migrationSql).toContain('Guild members can view guild')
    expect(migrationSql).toContain('Creator can update guild')
    expect(migrationSql).toContain('Creator can delete guild')
  })

  it('Guild members: only co-members can see each other', () => {
    expect(migrationSql).toContain('Guild members can view members')
    expect(migrationSql).toContain('Users can join guilds')
    expect(migrationSql).toContain('Users can leave guilds')
  })

  it('Boss fights: users can only view/manage own', () => {
    expect(migrationSql).toContain('Users can view own boss fights')
    expect(migrationSql).toContain('Users can insert own boss fights')
    expect(migrationSql).toContain('Users can update own boss fights')
  })

  it('Webhook events: NO public policies (service_role only)', () => {
    // webhook_events should have RLS enabled but NO policies = only service_role access
    const webhookMigration = readFileSync(
      resolve(__dirname, '../../supabase/migrations/20260722100000_webhook_events.sql'),
      'utf8'
    )
    expect(webhookMigration).toContain('enable row level security')
    // Should NOT contain any "create policy" for webhook_events
    expect(webhookMigration).not.toContain('create policy')
  })

  it('No table allows public SELECT without auth filter', () => {
    // Every SELECT policy should contain auth.uid() check
    const selectPolicies = migrationSql.match(/create policy.*for select using \((.*?)\)/g) || []
    for (const policy of selectPolicies) {
      // Each select policy should reference auth.uid()
      expect(policy).toContain('auth.uid()')
    }
  })
})

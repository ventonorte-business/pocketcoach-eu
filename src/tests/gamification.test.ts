import { describe, it, expect } from 'vitest'
import { getSproutState } from '@/lib/gamification/constants'

/**
 * Red Team R3 — Test #7: Streak calculation logic
 * Tests the Sprout state machine transitions.
 */

describe('Gamification — Sprout State Machine', () => {
  it('Test #7: streak 0 = wilting', () => {
    expect(getSproutState(0)).toBe('wilting')
  })

  it('Test #7: streak 1 = sprout', () => {
    expect(getSproutState(1)).toBe('sprout')
  })

  it('Test #7: streak 3 = sprout', () => {
    expect(getSproutState(3)).toBe('sprout')
  })

  it('Test #7: streak 4 = growing', () => {
    expect(getSproutState(4)).toBe('growing')
  })

  it('Test #7: streak 6 = growing', () => {
    expect(getSproutState(6)).toBe('growing')
  })

  it('Test #7: streak 7 = blooming', () => {
    expect(getSproutState(7)).toBe('blooming')
  })

  it('Test #7: streak 100 = blooming', () => {
    expect(getSproutState(100)).toBe('blooming')
  })

  it('Test #7: streak reset — today + yesterday = 2 (consecutive)', () => {
    // Simulating streak logic:
    // If user completed all habits today AND yesterday → streak = 2
    const logs = [
      { date: '2026-07-22', all_completed: true },
      { date: '2026-07-21', all_completed: true },
    ]
    let streak = 0
    for (const log of logs) {
      if (log.all_completed) streak++
      else break
    }
    expect(streak).toBe(2)
    expect(getSproutState(streak)).toBe('sprout')
  })

  it('Test #7: streak reset — today + gap = 1 (reset)', () => {
    // User completed today but NOT yesterday → streak resets to 1
    const logs = [
      { date: '2026-07-22', all_completed: true },
      { date: '2026-07-21', all_completed: false }, // gap!
      { date: '2026-07-20', all_completed: true },
    ]
    let streak = 0
    for (const log of logs) {
      if (log.all_completed) streak++
      else break
    }
    expect(streak).toBe(1)
    expect(getSproutState(streak)).toBe('sprout')
  })
})

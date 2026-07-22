'use client'

import { motion } from 'framer-motion'

type SproutState = 'sprout' | 'growing' | 'blooming' | 'wilting'

interface SproutProps {
  state: SproutState
  streak: number
  className?: string
}

const stateConfig: Record<SproutState, { emoji: string; color: string; label: string }> = {
  sprout: { emoji: '🌱', color: 'text-green-400', label: 'Just planted!' },
  growing: { emoji: '🌿', color: 'text-green-500', label: 'Growing strong' },
  blooming: { emoji: '🌸', color: 'text-pink-500', label: 'In full bloom!' },
  wilting: { emoji: '🥀', color: 'text-amber-600', label: 'Needs attention...' },
}

export function Sprout({ state, streak, className = '' }: SproutProps) {
  const config = stateConfig[state]

  return (
    <motion.div
      className={`flex flex-col items-center gap-1 ${className}`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      <motion.span
        className="text-5xl"
        animate={state === 'wilting' ? { rotate: [-5, 5, -5] } : { y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: state === 'wilting' ? 2 : 3 }}
      >
        {config.emoji}
      </motion.span>
      <span className={`text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
      {streak > 0 && (
        <span className="text-xs text-gray-500">
          🔥 {streak} day streak
        </span>
      )}
    </motion.div>
  )
}

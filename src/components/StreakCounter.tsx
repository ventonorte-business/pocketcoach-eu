'use client'

import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

interface StreakCounterProps {
  streak: number
  longestStreak: number
}

export function StreakCounter({ streak, longestStreak }: StreakCounterProps) {
  const isOnFire = streak >= 7
  const isRecord = streak >= longestStreak && streak > 0

  return (
    <motion.div
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm"
      animate={isOnFire ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: isOnFire ? Infinity : 0, duration: 2 }}
    >
      <Flame
        size={20}
        className={streak > 0 ? 'text-orange-500' : 'text-gray-300'}
        fill={streak > 0 ? 'currentColor' : 'none'}
      />
      <span className="font-bold text-lg">
        {streak}
      </span>
      <span className="text-xs text-gray-500">
        {streak === 1 ? 'day' : 'days'}
      </span>
      {isRecord && streak > 1 && (
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
          🏆 Record!
        </span>
      )}
    </motion.div>
  )
}

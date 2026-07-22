'use client'

import { motion } from 'framer-motion'

interface XpBarProps {
  currentXp: number
  levelXp: number // XP needed for next level
  level: number
}

export function XpBar({ currentXp, levelXp, level }: XpBarProps) {
  const progress = Math.min((currentXp / levelXp) * 100, 100)

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-purple-700">
          Level {level}
        </span>
        <span className="text-xs text-gray-500">
          {currentXp}/{levelXp} XP
        </span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  )
}

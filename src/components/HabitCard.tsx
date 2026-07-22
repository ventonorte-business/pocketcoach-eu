'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { useState } from 'react'

interface HabitCardProps {
  id: string
  title: string
  emoji: string
  isCompleted: boolean
  xpReward?: number
  onComplete: (id: string) => void
}

export function HabitCard({ id, title, emoji, isCompleted, xpReward = 10, onComplete }: HabitCardProps) {
  const [showXp, setShowXp] = useState(false)

  function handleComplete() {
    if (isCompleted) return
    onComplete(id)
    setShowXp(true)
    setTimeout(() => setShowXp(false), 1500)
  }

  return (
    <motion.div
      layout
      className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 transition-colors ${
        isCompleted
          ? 'border-green-300 bg-green-50'
          : 'border-gray-200 bg-white hover:border-green-200'
      }`}
    >
      <span className="text-2xl">{emoji}</span>

      <span className={`flex-1 font-medium ${
        isCompleted ? 'text-green-700 line-through opacity-70' : 'text-gray-800'
      }`}>
        {title}
      </span>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={handleComplete}
        disabled={isCompleted}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isCompleted
            ? 'bg-green-500 text-white'
            : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
        }`}
      >
        <Check size={20} strokeWidth={3} />
      </motion.button>

      {/* XP popup animation */}
      <AnimatePresence>
        {showXp && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute right-2 top-0 text-green-600 font-bold text-sm"
          >
            +{xpReward} XP ✨
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

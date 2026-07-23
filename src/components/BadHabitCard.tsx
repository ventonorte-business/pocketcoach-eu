'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Minus } from 'lucide-react'
import { useState } from 'react'

interface BadHabitCardProps {
  id: string
  title: string
  emoji: string
  /** Total slip-count for today. Each tap increments by 1. */
  slipCount: number
  /** Daily cap — UI warns / disables further taps once reached. */
  maxSlipsPerDay?: number
  onSlip: (id: string) => void
}

/**
 * Card for "reduce" habits (bad habits to break).
 *
 * Unlike HabitCard (build → +XP, check verde), each tap is a SLIP — a count
 * the user wants to keep LOW. Visual semantics inverted:
 *  - red-50 background + red border
 *  - minus icon instead of check
 *  - "+1" toast instead of "+XP"
 */
export function BadHabitCard({
  id,
  title,
  emoji,
  slipCount,
  maxSlipsPerDay = 99,
  onSlip,
}: BadHabitCardProps) {
  const [showSlip, setShowSlip] = useState(false)
  const isAtCap = slipCount >= maxSlipsPerDay

  function handleSlip() {
    if (isAtCap) return
    onSlip(id)
    setShowSlip(true)
    setTimeout(() => setShowSlip(false), 1500)
  }

  return (
    <motion.div
      layout
      className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 transition-colors ${
        isAtCap
          ? 'border-red-400 bg-red-100'
          : slipCount > 0
            ? 'border-red-300 bg-red-50'
            : 'border-gray-200 bg-white hover:border-red-200'
      }`}
    >
      <span className="text-2xl">{emoji}</span>

      <span className="flex-1 font-medium text-gray-800">{title}</span>

      {/* Slip counter pill */}
      <span
        className={`min-w-9 px-2 h-7 rounded-full flex items-center justify-center text-sm font-semibold ${
          isAtCap
            ? 'bg-red-600 text-white'
            : slipCount > 0
              ? 'bg-red-500 text-white'
              : 'bg-gray-100 text-gray-400'
        }`}
        aria-label={`${slipCount} slips today`}
      >
        −{slipCount}
      </span>

      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={handleSlip}
        disabled={isAtCap}
        aria-label="Log a slip"
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          isAtCap
            ? 'bg-red-700 text-white cursor-not-allowed'
            : 'bg-red-100 text-red-600 hover:bg-red-200'
        }`}
      >
        <Minus size={20} strokeWidth={3} />
      </motion.button>

      {/* "+1 slip" toast */}
      <AnimatePresence>
        {showSlip && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -30, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="absolute right-12 top-0 text-red-600 font-bold text-sm"
          >
            +1 slip
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

'use client'

import { motion } from 'framer-motion'

interface ProPaywallProps {
  feature: string
  onUpgrade: () => void
  onDismiss: () => void
}

export function ProPaywall({ feature, onUpgrade, onDismiss }: ProPaywallProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4"
      onClick={onDismiss}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <span className="text-4xl">🌟</span>
          <h2 className="text-xl font-bold mt-2">Unlock {feature}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Upgrade to Pro for unlimited habits, guilds, boss fights & more.
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 mb-4">
          <div className="flex justify-between items-baseline mb-3">
            <span className="text-2xl font-bold">€7.90</span>
            <span className="text-sm text-gray-500">/month</span>
          </div>
          <ul className="text-sm text-gray-700 space-y-2">
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Unlimited habits</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Unlimited guilds</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Weekly boss fights</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Daily reflections</li>
            <li className="flex items-center gap-2"><span className="text-green-500">✓</span> Data export</li>
          </ul>
        </div>

        <button
          onClick={onUpgrade}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity"
        >
          Upgrade to Pro
        </button>

        <button
          onClick={onDismiss}
          className="w-full py-2 mt-2 text-sm text-gray-400 hover:text-gray-600"
        >
          Maybe later
        </button>
      </motion.div>
    </motion.div>
  )
}

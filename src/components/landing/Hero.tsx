'use client'

import { motion } from 'framer-motion'
import { Sprout } from '@/components/Sprout'

export function Hero() {
  return (
    <section className="flex flex-col items-center text-center py-16 gap-6">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        <Sprout state="blooming" streak={7} />
      </motion.div>

      <motion.h1
        className="text-3xl font-bold tracking-tight"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Micro-habits.<br />Macro results.
      </motion.h1>

      <motion.p
        className="text-gray-500 max-w-xs text-sm"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Build lasting habits in 5 minutes a day. Gamified streaks, guilds of 5 friends,
        and a mascot that grows with you.
      </motion.p>

      <motion.a
        href="/auth"
        className="px-6 py-3 rounded-full bg-green-500 text-white font-medium hover:bg-green-600 transition-colors shadow-lg shadow-green-500/25"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Start free — no credit card
      </motion.a>
    </section>
  )
}

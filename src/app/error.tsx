'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error reporting service (Sentry, etc.)
    console.error('[PocketCoach Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <span className="text-4xl">😓</span>
      <h2 className="text-lg font-bold">Something went wrong</h2>
      <p className="text-sm text-gray-500 max-w-xs">
        Don&apos;t worry — your streaks are safe. Try again.
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600"
      >
        Try again
      </button>
    </div>
  )
}

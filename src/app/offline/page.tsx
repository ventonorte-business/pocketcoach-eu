'use client'

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4 text-center">
      <span className="text-5xl">🌱</span>
      <h1 className="text-xl font-bold">You&apos;re offline</h1>
      <p className="text-sm text-gray-500 max-w-xs">
        Don&apos;t worry — your streaks are safe! Connect to the internet to sync your progress.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600"
      >
        Try again
      </button>
    </div>
  )
}

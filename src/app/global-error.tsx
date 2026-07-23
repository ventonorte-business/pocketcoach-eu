'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <span className="text-5xl">🌱</span>
          <h2 className="text-xl font-bold">PocketCoach encountered an error</h2>
          <p className="text-sm text-gray-500">Your data is safe. Please try again.</p>
          <button
            onClick={reset}
            className="px-6 py-3 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600"
          >
            Reload app
          </button>
        </div>
      </body>
    </html>
  )
}

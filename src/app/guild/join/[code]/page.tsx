'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGuild } from '@/hooks/useGuild'

export default function JoinGuildPage() {
  const params = useParams()
  const code = params.code as string
  const { joinGuild, guild } = useGuild()
  const [status, setStatus] = useState<'joining' | 'success' | 'error'>('joining')
  const router = useRouter()

  useEffect(() => {
    if (guild) {
      // Already in a guild
      router.push('/guild')
      return
    }

    async function attemptJoin() {
      const success = await joinGuild(code)
      setStatus(success ? 'success' : 'error')
      if (success) {
        setTimeout(() => router.push('/guild'), 1500)
      }
    }
    attemptJoin()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
      {status === 'joining' && (
        <>
          <div className="animate-pulse text-4xl">⚔️</div>
          <p className="text-gray-500">Joining guild...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="text-4xl">🎉</div>
          <p className="text-green-700 font-medium">Welcome to the guild!</p>
          <p className="text-sm text-gray-500">Redirecting...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="text-4xl">😓</div>
          <p className="text-red-600 font-medium">Couldn&apos;t join guild</p>
          <p className="text-sm text-gray-500">Invalid code or guild is full (max 5).</p>
          <button
            onClick={() => router.push('/guild')}
            className="mt-4 px-4 py-2 bg-gray-100 rounded-xl text-sm"
          >
            Go to guild page
          </button>
        </>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sprout } from '@/components/Sprout'

export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setStatus('error')
      setErrorMsg(error.message)
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
      <Sprout state="sprout" streak={0} />
      <h1 className="text-2xl font-bold text-center">PocketCoach</h1>
      <p className="text-gray-500 text-center text-sm max-w-xs">
        Micro-habits. Macro results. 5 minutes a day.
      </p>

      {status === 'sent' ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center max-w-xs">
          <p className="text-green-800 font-medium">✨ Check your inbox!</p>
          <p className="text-green-600 text-sm mt-2">
            We sent a magic link to <strong>{email}</strong>. Click it to sign in.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full px-4 py-3 rounded-xl bg-green-500 text-white font-medium text-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Sending...' : 'Send magic link'}
          </button>
          {status === 'error' && (
            <p className="text-red-500 text-xs text-center">{errorMsg}</p>
          )}
          <p className="text-xs text-gray-400 text-center">
            No password needed. We&apos;ll email you a link.
          </p>
        </form>
      )}
    </div>
  )
}

'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Locale } from '@/i18n/locale'

const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
]

export function LanguageSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function handleChange(locale: Locale) {
    // Set cookie via server action
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="flex gap-1">
      {LOCALES.map((l) => (
        <button
          key={l.code}
          onClick={() => handleChange(l.code)}
          disabled={isPending}
          className={`text-lg px-1 py-0.5 rounded transition-opacity ${
            currentLocale === l.code
              ? 'opacity-100 ring-2 ring-green-400 ring-offset-1'
              : 'opacity-50 hover:opacity-80'
          }`}
          title={l.label}
        >
          {l.flag}
        </button>
      ))}
    </div>
  )
}

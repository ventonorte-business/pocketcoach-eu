/**
 * Umami analytics wrapper.
 * If NEXT_PUBLIC_UMAMI_WEBSITE_ID is not set, renders nothing (graceful degradation).
 * No cookies, no tracking consent banner needed (GDPR-friendly).
 */
import Script from 'next/script'

export function Analytics() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC || 'https://cloud.umami.is/script.js'

  if (!websiteId) return null

  return (
    <Script
      defer
      src={src}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  )
}

/**
 * Track custom events (call from client components).
 * Falls back silently if umami global is not loaded.
 */
export function trackEvent(name: string, data?: Record<string, string | number>) {
  if (typeof window !== 'undefined' && (window as unknown as { umami?: { track: (name: string, data?: Record<string, string | number>) => void } }).umami) {
    ;(window as unknown as { umami: { track: (name: string, data?: Record<string, string | number>) => void } }).umami.track(name, data)
  }
}

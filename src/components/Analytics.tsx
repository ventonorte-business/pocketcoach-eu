/**
 * Umami analytics wrapper.
 * If NEXT_PUBLIC_UMAMI_WEBSITE_ID is not set, renders nothing (graceful degradation).
 * No cookies, no tracking consent banner needed (GDPR-friendly).
 *
 * Subresource Integrity (Red Team S5):
 *   When NEXT_PUBLIC_UMAMI_INTEGRITY is set, the script tag carries an integrity
 *   attribute so the browser refuses to execute if the file is tampered with.
 *
 *   Generate the hash from the served script:
 *     curl -s https://cloud.umami.is/script.js -o /tmp/umami.js
 *     openssl dgst -sha384 -binary /tmp/umami.js | openssl base64 -A
 *     # paste the output as NEXT_PUBLIC_UMAMI_INTEGRITY
 *     # prepend "sha384-" → e.g. sha384-AbCdEf...
 *
 *   Or one-liner:
 *     openssl dgst -sha384 -binary <(curl -s https://cloud.umami.is/script.js) | openssl base64 -A
 */
import Script from 'next/script'

export function Analytics() {
  const websiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID
  const src = process.env.NEXT_PUBLIC_UMAMI_SRC || 'https://cloud.umami.is/script.js'
  const integrity = process.env.NEXT_PUBLIC_UMAMI_INTEGRITY // e.g. "sha384-AbCdEf..."

  if (!websiteId) return null

  // integrity is optional — when not set, SRI is skipped (still safer than
  // nothing; Umami serves from its own CDN).
  return (
    <Script
      defer
      src={src}
      data-website-id={websiteId}
      strategy="afterInteractive"
      {...(integrity ? { integrity, crossOrigin: 'anonymous' } : {})}
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
/**
 * Sentry initialization helper.
 * Red Team R3 — Monitoring: captures errors in production.
 * Free tier: 5k events/month, 1 project.
 *
 * To activate: set NEXT_PUBLIC_SENTRY_DSN in .env.local
 * Get DSN from: https://sentry.io → Create project → Next.js
 */

export function initSentry() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return // graceful degradation — no Sentry = no crash

  // Dynamic import to avoid bundling Sentry when DSN not set
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1, // 10% of transactions (saves quota)
      replaysSessionSampleRate: 0, // no replays on free tier
      replaysOnErrorSampleRate: 0,
    })
  })
}

/**
 * Report an error manually (for caught errors).
 */
export async function reportError(error: Error, context?: Record<string, unknown>) {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) {
    console.error('[PocketCoach]', error, context)
    return
  }

  const Sentry = await import('@sentry/nextjs')
  if (context) Sentry.setContext('custom', context)
  Sentry.captureException(error)
}

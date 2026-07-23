/**
 * Discord webhook alerts (Red Team S12).
 *
 * Sends structured embeds to a Discord channel via a webhook URL configured
 * in the DISCORD_WEBHOOK_URL env var. Color codes follow Discord's
 * conventions:
 *   - error    → red    (16711680)
 *   - warning  → orange (15105570)
 *   - info     → green  (3066993)
 *
 * Failures are swallowed: alerting itself must never crash a webhook or cron.
 */

export type AlertSeverity = 'error' | 'warning' | 'info'

const COLOR: Record<AlertSeverity, number> = {
  error: 0xfe0303,   // red
  warning: 0xe67e22, // orange
  info: 0x2ecc71,    // green
}

interface DiscordEmbedField {
  name: string
  value: string
  inline?: boolean
}

interface DiscordEmbed {
  title: string
  description?: string
  color: number
  fields?: DiscordEmbedField[]
  timestamp?: string
  footer?: { text: string }
}

interface DiscordWebhookPayload {
  embeds: DiscordEmbed[]
  username?: string
}

/**
 * Send a Discord alert. No-op if DISCORD_WEBHOOK_URL is not configured.
 *
 * @example
 *   await sendDiscordAlert('Webhook failed', 'LemSqueezy 500', 'error', {
 *     event_id: 'evt_123',
 *     user_id: '...',
 *   })
 */
export async function sendDiscordAlert(
  title: string,
  message: string,
  severity: AlertSeverity = 'info',
  fields?: Record<string, string | number | boolean | null | undefined>,
): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL
  if (!webhookUrl) {
    // Silent in dev — no webhook configured yet.
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[discord-alert:${severity}] ${title} — ${message}`)
    }
    return
  }

  const embedFields: DiscordEmbedField[] = fields
    ? Object.entries(fields)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([name, value]) => ({
          name,
          value: String(value),
          inline: String(value).length < 30,
        }))
    : []

  const payload: DiscordWebhookPayload = {
    username: 'PocketCoach EU Alerts',
    embeds: [
      {
        title: title.slice(0, 256),
        description: message.slice(0, 2048),
        color: COLOR[severity],
        fields: embedFields.length > 0 ? embedFields.slice(0, 25) : undefined,
        timestamp: new Date().toISOString(),
        footer: { text: `severity: ${severity}` },
      },
    ],
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      console.error(
        `[discord-alert] webhook returned ${res.status}: ${await res.text().catch(() => '<no body>')}`,
      )
    }
  } catch (err) {
    // Never let an alert failure cascade.
    console.error('[discord-alert] fetch failed:', err)
  }
}
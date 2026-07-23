import type { SupabaseClient } from '@supabase/supabase-js'

type ProcessResult = {
  changed: boolean
  action?: 'pro_upgrade' | 'pro_downgrade'
  isPro?: boolean
}

function getWebhookMeta(event: any) {
  return {
    eventName: String(event?.meta?.event_name || ''),
    userId: String(event?.meta?.custom_data?.user_id || ''),
    eventId: String(event?.meta?.webhook_id || event?.data?.id || ''),
  }
}

/**
 * Process a Lemon Squeezy subscription webhook event.
 * Shared by the webhook route and admin reconcile reprocess route.
 */
export async function processLemonSqueezyWebhookEvent(
  supabaseAdmin: SupabaseClient,
  event: any,
  options?: { ip?: string | null; reprocess?: boolean },
): Promise<ProcessResult> {
  const { eventName, userId, eventId } = getWebhookMeta(event)

  if (!userId) {
    throw new Error('No user_id in custom_data')
  }

  let nextIsPro: boolean | undefined
  let action: 'pro_upgrade' | 'pro_downgrade' | undefined

  switch (eventName) {
    case 'subscription_created':
    case 'subscription_resumed':
    case 'subscription_unpaused':
      nextIsPro = true
      action = 'pro_upgrade'
      break

    case 'subscription_expired':
    case 'subscription_cancelled':
    case 'subscription_paused':
      nextIsPro = false
      action = 'pro_downgrade'
      break

    case 'subscription_updated': {
      const status = event?.data?.attributes?.status
      nextIsPro = status === 'active' || status === 'on_trial'
      action = nextIsPro ? 'pro_upgrade' : 'pro_downgrade'
      break
    }

    default:
      return { changed: false }
  }

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ is_pro: nextIsPro })
    .eq('id', userId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  // Sensitive mutation audit log (Red Team S6).
  await supabaseAdmin.from('audit_log').insert({
    user_id: userId,
    action,
    details: {
      source: 'lemonsqueezy',
      event_name: eventName,
      event_id: eventId,
      reprocess: !!options?.reprocess,
      is_pro: nextIsPro,
    },
    ip: options?.ip || null,
  })

  return { changed: true, action, isPro: nextIsPro }
}

export function extractLemonSqueezyWebhookMeta(event: any) {
  return getWebhookMeta(event)
}
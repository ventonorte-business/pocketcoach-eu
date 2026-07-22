import { NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/lemonsqueezy'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// Create admin client lazily (service_role key only available at runtime, not build time)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  )
}

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('x-signature') || ''

  // Verify signature
  const isValid = await verifyWebhookSignature(body, signature)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(body)
  const eventName = event.meta?.event_name
  const userId = event.meta?.custom_data?.user_id

  if (!userId) {
    return NextResponse.json({ error: 'No user_id in custom_data' }, { status: 400 })
  }

  const supabaseAdmin = getAdminClient()

  switch (eventName) {
    case 'subscription_created':
    case 'subscription_resumed':
    case 'subscription_unpaused': {
      // Mark user as pro
      await supabaseAdmin
        .from('profiles')
        .update({ is_pro: true })
        .eq('id', userId)
      break
    }

    case 'subscription_expired':
    case 'subscription_cancelled':
    case 'subscription_paused': {
      // Remove pro status
      await supabaseAdmin
        .from('profiles')
        .update({ is_pro: false })
        .eq('id', userId)
      break
    }

    case 'subscription_updated': {
      // Check if still active
      const status = event.data?.attributes?.status
      const isPro = status === 'active' || status === 'on_trial'
      await supabaseAdmin
        .from('profiles')
        .update({ is_pro: isPro })
        .eq('id', userId)
      break
    }
  }

  return NextResponse.json({ received: true })
}

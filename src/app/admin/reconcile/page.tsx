import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase/server'
import { processLemonSqueezyWebhookEvent } from '@/lib/webhooks/lemonsqueezy'

export const dynamic = 'force-dynamic'

type WebhookEventRow = {
  id: string
  source: string
  event_id: string
  event_name: string
  status: 'received' | 'processed' | 'failed' | 'reprocessed'
  last_error: string | null
  processed_at: string
  reprocessed_at: string | null
  payload: unknown
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } },
  )
}

async function requireAdmin() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/')
  return user
}

async function reprocessWebhook(formData: FormData) {
  'use server'
  await requireAdmin()

  const id = String(formData.get('id') || '')
  if (!id) return

  const admin = adminClient()
  const { data: event, error } = await admin
    .from('webhook_events')
    .select('id, source, event_id, event_name, payload')
    .eq('id', id)
    .single()

  if (error || !event) {
    throw new Error(error?.message || 'Webhook event not found')
  }

  if (event.source !== 'lemonsqueezy') {
    throw new Error(`Unsupported webhook source: ${event.source}`)
  }

  try {
    await processLemonSqueezyWebhookEvent(admin, event.payload, { reprocess: true })
    await admin
      .from('webhook_events')
      .update({
        status: 'reprocessed',
        last_error: null,
        reprocessed_at: new Date().toISOString(),
      })
      .eq('id', id)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await admin
      .from('webhook_events')
      .update({ status: 'failed', last_error: message })
      .eq('id', id)
  }

  revalidatePath('/admin/reconcile')
}

function StatusBadge({ status }: { status: WebhookEventRow['status'] }) {
  const color =
    status === 'failed'
      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      : status === 'received'
        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${color}`}>
      {status}
    </span>
  )
}

export default async function AdminReconcilePage() {
  await requireAdmin()

  const { data: events, error } = await adminClient()
    .from('webhook_events')
    .select('id, source, event_id, event_name, status, last_error, processed_at, reprocessed_at, payload')
    .order('processed_at', { ascending: false })
    .limit(100)

  if (error) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Webhook Reconciliation</h1>
        <p className="rounded-lg bg-red-100 p-3 text-red-700">{error.message}</p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Admin</p>
        <h1 className="text-2xl font-bold">Webhook Reconciliation</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Recovery panel for Lemon Squeezy webhook events. Reprocess failed or suspicious events after checking the payload.
        </p>
      </div>

      <div className="space-y-3">
        {(events as WebhookEventRow[] | null)?.length ? (
          (events as WebhookEventRow[]).map((event) => (
            <article key={event.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={event.status} />
                    <span className="text-xs uppercase tracking-wide text-gray-500">{event.source}</span>
                  </div>
                  <h2 className="truncate text-base font-semibold">{event.event_name || 'unknown event'}</h2>
                  <p className="truncate text-xs text-gray-500">event_id: {event.event_id}</p>
                </div>

                <form action={reprocessWebhook}>
                  <input type="hidden" name="id" value={event.id} />
                  <button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                    Reprocess
                  </button>
                </form>
              </div>

              <dl className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-600 dark:text-gray-300">
                <div>
                  <dt className="font-semibold">Processed at</dt>
                  <dd>{new Date(event.processed_at).toLocaleString()}</dd>
                </div>
                {event.reprocessed_at && (
                  <div>
                    <dt className="font-semibold">Reprocessed at</dt>
                    <dd>{new Date(event.reprocessed_at).toLocaleString()}</dd>
                  </div>
                )}
                {event.last_error && (
                  <div className="rounded-lg bg-red-50 p-2 text-red-700 dark:bg-red-950/40 dark:text-red-300">
                    <dt className="font-semibold">Last error</dt>
                    <dd>{event.last_error}</dd>
                  </div>
                )}
              </dl>
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            No webhook events recorded yet.
          </p>
        )}
      </div>
    </section>
  )
}
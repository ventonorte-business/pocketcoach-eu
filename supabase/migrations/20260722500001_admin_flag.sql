-- Admin flag + webhook recovery metadata (Red Team S8)
-- Adds profiles.is_admin to gate /admin/* routes.
-- Adds status/error fields to webhook_events for reconcile dashboard.

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

comment on column public.profiles.is_admin is
  'When true, user can access /admin/* routes (reconcile, etc.). Set manually via SQL Editor or service_role.';

alter table public.webhook_events
  add column if not exists status text not null default 'processed'
    check (status in ('received', 'processed', 'failed', 'reprocessed')),
  add column if not exists last_error text,
  add column if not exists reprocessed_at timestamptz;

create index if not exists idx_webhook_events_status_processed_at
  on public.webhook_events(status, processed_at desc);

comment on column public.webhook_events.status is
  'Webhook processing status for admin reconciliation: received, processed, failed, reprocessed.';
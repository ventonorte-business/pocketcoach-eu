-- Idempotency table for webhook processing (Red Team S1.1)
-- Prevents replay attacks and duplicate event processing

create table if not exists public.webhook_events (
  id uuid primary key default uuid_generate_v4(),
  source text not null default 'lemonsqueezy', -- lemonsqueezy | stripe | etc
  event_id text not null,
  event_name text not null,
  payload jsonb not null default '{}',
  processed_at timestamptz not null default now(),
  unique (source, event_id)
);

-- Index for fast lookup
create index idx_webhook_events_source_event on public.webhook_events(source, event_id);

-- RLS: no public access (only service_role via admin client)
alter table public.webhook_events enable row level security;
-- No policies = only service_role can access (which is correct for webhooks)

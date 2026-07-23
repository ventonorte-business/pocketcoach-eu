-- Audit log for sensitive mutations (Red Team S6)
-- Tracks account_delete, profile_email_change, pro_upgrade, pro_downgrade
-- RLS: users see own entries; admins see everything (is_admin = true on profiles)

create table if not exists public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in (
    'account_delete',
    'profile_email_change',
    'pro_upgrade',
    'pro_downgrade'
  )),
  details jsonb not null default '{}',
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_log_user_created
  on public.audit_log(user_id, created_at desc);

create index if not exists idx_audit_log_action_created
  on public.audit_log(action, created_at desc);

alter table public.audit_log enable row level security;

-- Migration-order safe admin check.
-- 20260722500001_admin_flag.sql adds profiles.is_admin. This function can be
-- created before that column exists because it converts the row to JSONB first;
-- once is_admin exists, to_jsonb(p)->>'is_admin' starts returning its value.
create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
as $$
  select coalesce(bool_or(coalesce((to_jsonb(p)->>'is_admin')::boolean, false)), false)
  from public.profiles p
  where p.id = auth.uid()
$$;

-- Users can read their own audit log
create policy "Users can view own audit log"
  on public.audit_log
  for select
  using (auth.uid() = user_id);

-- Admins can read all audit log entries
create policy "Admins can view all audit log"
  on public.audit_log
  for select
  using (public.current_user_is_admin());

-- Inserts only via service_role (admin client). No insert/update/delete policies for anon/authenticated.
-- This prevents client-side tampering with the audit trail.

comment on table public.audit_log is
  'GDPR Art. 30 — record of processing. Inserts only via service_role.';
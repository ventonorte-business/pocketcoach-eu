-- Soft delete with 30-day GDPR window (Red Team S9)
-- Replaces immediate hard-delete with a 30-day pending_deletion state.
-- Cron hard-deletes accounts whose deleted_at is older than 30 days.

alter table public.profiles
  add column if not exists deleted_at timestamptz;

create index if not exists idx_profiles_deleted_at
  on public.profiles(deleted_at)
  where deleted_at is not null;

comment on column public.profiles.deleted_at is
  'When set, account is in pending_deletion state — auth blocked, data preserved for 30 days for undo.';

-- Helper RPC: hard-delete accounts whose soft-delete window has expired.
-- Run periodically (e.g. daily cron). Returns the count of removed profiles.
create or replace function public.purge_expired_soft_deleted()
returns integer
language plpgsql
security definer
as $$
declare
  purged_count integer;
begin
  with expired as (
    select id
    from public.profiles
    where deleted_at is not null
      and deleted_at < now() - interval '30 days'
  ),
  deleted as (
    delete from public.profiles
    where id in (select id from expired)
    returning id
  )
  select count(*) into purged_count from deleted;

  return purged_count;
end;
$$;

comment on function public.purge_expired_soft_deleted() is
  'GDPR hard-delete for accounts whose 30-day soft-delete window expired. Admin/service_role only.';
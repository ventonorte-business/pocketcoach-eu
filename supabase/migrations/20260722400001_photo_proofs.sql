-- PocketCoach EU — Photo Proof of Completion (Finch gap)
-- Bucket + optional photo URL on each completion.

-- Bucket 'proofs' (private, user-scoped via RLS)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('proofs', 'proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

-- Column on completions
alter table public.completions
  add column if not exists proof_url text;

comment on column public.completions.proof_url is
  'Optional Supabase Storage URL of photo proof uploaded at completion time';

-- Storage RLS: a user can only access their own proof files
-- Path convention: {user_id}/{habit_id}/{completion_id-or-timestamp}.{ext}
create policy "Users can upload own proofs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read own proofs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own proofs"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'proofs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

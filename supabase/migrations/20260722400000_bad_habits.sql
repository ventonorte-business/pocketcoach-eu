-- PocketCoach EU — Bad Habits Tracking (Productive gap)
-- Allows tracking habits to REDUCE instead of build.
-- Default 'build' keeps backward compatibility.

alter table public.habits
  add column if not exists habit_type text not null default 'build'
    check (habit_type in ('build', 'reduce'));

-- Index for filtering by type (e.g., "show all reduce habits")
create index if not exists idx_habits_user_type on public.habits(user_id, habit_type) where not is_archived;

comment on column public.habits.habit_type is
  'build = track completions to grow streak; reduce = track slips to monitor (anti-streak)';

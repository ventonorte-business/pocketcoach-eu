-- Daily reset function (Red Team P.3 — batch optimization)
-- Designed to run as a cron job via pg_cron or Vercel Cron → API route
-- Processes ALL users in a single SQL statement (no N+1 loop)
-- Scales to 10k+ users within 60s Edge Function timeout

create or replace function public.daily_reset()
returns jsonb
language plpgsql security definer
as $$
declare
  v_today date := current_date;
  v_yesterday date := current_date - interval '1 day';
  v_processed integer := 0;
  v_streaks_broken integer := 0;
  v_quests_generated integer := 0;
begin
  -- Step 1: Calculate yesterday's completions for ALL users in one pass
  -- Insert streak_log entries for yesterday (if not already done)
  insert into public.streak_log (user_id, log_date, all_habits_completed, habits_completed, habits_total, streak_day)
  select
    p.id as user_id,
    v_yesterday as log_date,
    case when coalesce(completed.cnt, 0) >= coalesce(total.cnt, 0) and coalesce(total.cnt, 0) > 0 then true else false end as all_habits_completed,
    coalesce(completed.cnt, 0) as habits_completed,
    coalesce(total.cnt, 0) as habits_total,
    case when coalesce(completed.cnt, 0) >= coalesce(total.cnt, 0) and coalesce(total.cnt, 0) > 0
      then p.current_streak + 1
      else 0
    end as streak_day
  from public.profiles p
  left join (
    -- Count completions yesterday per user
    select user_id, count(distinct habit_id) as cnt
    from public.completions
    where completed_date = v_yesterday
    group by user_id
  ) completed on completed.user_id = p.id
  left join (
    -- Count active habits per user
    select user_id, count(*) as cnt
    from public.habits
    where is_archived = false
    group by user_id
  ) total on total.user_id = p.id
  on conflict (user_id, log_date) do nothing;

  get diagnostics v_processed = row_count;

  -- Step 2: Update streaks for users who completed all habits yesterday
  update public.profiles p
  set
    current_streak = current_streak + 1,
    longest_streak = greatest(longest_streak, current_streak + 1),
    streak_updated_at = v_today,
    avatar_state = case
      when current_streak + 1 >= 7 then 'blooming'
      when current_streak + 1 >= 4 then 'growing'
      else 'sprout'
    end
  from public.streak_log sl
  where sl.user_id = p.id
    and sl.log_date = v_yesterday
    and sl.all_habits_completed = true
    and (p.streak_updated_at is null or p.streak_updated_at < v_today);

  -- Step 3: Reset streaks for users who did NOT complete all habits yesterday
  update public.profiles p
  set
    current_streak = 0,
    streak_updated_at = v_today,
    avatar_state = 'wilting'
  from public.streak_log sl
  where sl.user_id = p.id
    and sl.log_date = v_yesterday
    and sl.all_habits_completed = false
    and (p.streak_updated_at is null or p.streak_updated_at < v_today);

  select count(*) into v_streaks_broken
  from public.profiles where avatar_state = 'wilting' and streak_updated_at = v_today;

  -- Step 4: Generate daily quests for today (batch insert)
  insert into public.daily_quests (user_id, quest_date, quest_type, quest_payload, xp_reward)
  select
    p.id,
    v_today,
    (array['complete_all', 'complete_n', 'reflect'])[1 + floor(random() * 3)],
    case
      when (array['complete_all', 'complete_n', 'reflect'])[1 + floor(random() * 3)] = 'complete_n'
      then jsonb_build_object('target', 2 + floor(random() * 3))
      else '{}'::jsonb
    end,
    25
  from public.profiles p
  where not exists (
    select 1 from public.daily_quests dq
    where dq.user_id = p.id and dq.quest_date = v_today
  )
  on conflict (user_id, quest_date) do nothing;

  get diagnostics v_quests_generated = row_count;

  return jsonb_build_object(
    'processed', v_processed,
    'streaks_broken', v_streaks_broken,
    'quests_generated', v_quests_generated,
    'date', v_today::text
  );
end;
$$;

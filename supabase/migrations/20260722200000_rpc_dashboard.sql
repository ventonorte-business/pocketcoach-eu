-- RPC consolidada: get_home_dashboard (Red Team P.1)
-- Single round-trip que retorna tudo que a home page precisa
-- Reduz 6-8 queries → 1 query = -70% TTFB

create or replace function public.get_home_dashboard(p_user_id uuid)
returns jsonb
language plpgsql security definer
as $$
declare
  result jsonb;
  v_profile jsonb;
  v_habits jsonb;
  v_completions jsonb;
  v_streak_log jsonb;
  v_daily_quest jsonb;
  v_guild jsonb;
  v_today date := current_date;
begin
  -- Profile
  select to_jsonb(p.*) into v_profile
  from public.profiles p
  where p.id = p_user_id;

  -- Active habits
  select coalesce(jsonb_agg(to_jsonb(h.*) order by h.created_at), '[]'::jsonb) into v_habits
  from public.habits h
  where h.user_id = p_user_id and h.is_archived = false;

  -- Today's completions
  select coalesce(jsonb_agg(to_jsonb(c.*)), '[]'::jsonb) into v_completions
  from public.completions c
  where c.user_id = p_user_id and c.completed_date = v_today;

  -- Latest streak log entry
  select to_jsonb(s.*) into v_streak_log
  from public.streak_log s
  where s.user_id = p_user_id
  order by s.log_date desc
  limit 1;

  -- Today's daily quest
  select to_jsonb(q.*) into v_daily_quest
  from public.daily_quests q
  where q.user_id = p_user_id and q.quest_date = v_today;

  -- Guild membership (if any)
  select jsonb_build_object(
    'guild', to_jsonb(g.*),
    'members_count', (select count(*) from public.guild_members gm where gm.guild_id = g.id)
  ) into v_guild
  from public.guild_members gm
  join public.guilds g on g.id = gm.guild_id
  where gm.user_id = p_user_id
  limit 1;

  -- Assemble result
  result := jsonb_build_object(
    'profile', coalesce(v_profile, 'null'::jsonb),
    'habits', coalesce(v_habits, '[]'::jsonb),
    'completions_today', coalesce(v_completions, '[]'::jsonb),
    'streak_log_latest', coalesce(v_streak_log, 'null'::jsonb),
    'daily_quest', coalesce(v_daily_quest, 'null'::jsonb),
    'guild', coalesce(v_guild, 'null'::jsonb)
  );

  return result;
end;
$$;

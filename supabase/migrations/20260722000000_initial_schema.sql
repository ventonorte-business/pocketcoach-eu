-- PocketCoach EU — Schema inicial
-- Hábitos + Streaks + XP + Guilds + Boss Fights

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users (extends Supabase auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_state text not null default 'sprout', -- sprout | growing | blooming | wilting
  total_xp integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  streak_updated_at date,
  timezone text not null default 'Europe/Amsterdam',
  is_pro boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Habits
create table public.habits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  emoji text not null default '✅',
  frequency text not null default 'daily', -- daily | weekdays | custom
  custom_days integer[] default '{}', -- 0=Sun, 1=Mon, ..., 6=Sat
  target_count integer not null default 1, -- times per day
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Habit completions (one row per completion event)
create table public.completions (
  id uuid primary key default uuid_generate_v4(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  completed_date date not null default current_date, -- for grouping by day
  xp_earned integer not null default 10
);

-- Streaks (daily snapshot for fast queries)
create table public.streak_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  log_date date not null,
  all_habits_completed boolean not null default false,
  habits_completed integer not null default 0,
  habits_total integer not null default 0,
  streak_day integer not null default 0, -- consecutive day number
  unique (user_id, log_date)
);

-- Daily Quest (generated per user per day)
create table public.daily_quests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  quest_date date not null default current_date,
  quest_type text not null default 'complete_all', -- complete_all | complete_n | reflect | boss_fight
  quest_payload jsonb not null default '{}',
  is_completed boolean not null default false,
  xp_reward integer not null default 25,
  completed_at timestamptz,
  unique (user_id, quest_date)
);

-- Guilds (groups of up to 5 friends)
create table public.guilds (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  invite_code text not null unique default encode(gen_random_bytes(6), 'hex'),
  created_by uuid not null references public.profiles(id) on delete cascade,
  max_members integer not null default 5,
  created_at timestamptz not null default now()
);

create table public.guild_members (
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (guild_id, user_id)
);

-- Boss Fights (weekly challenge)
create table public.boss_fights (
  id uuid primary key default uuid_generate_v4(),
  guild_id uuid references public.guilds(id) on delete set null, -- null = solo
  user_id uuid not null references public.profiles(id) on delete cascade,
  week_start date not null, -- Monday of the week
  target_completions integer not null default 35, -- e.g. 5 habits × 7 days
  current_completions integer not null default 0,
  is_defeated boolean not null default false,
  boss_name text not null default 'Procrastination Dragon',
  xp_reward integer not null default 100,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- Reflections (1 sentence/day for XP)
create table public.reflections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reflection_date date not null default current_date,
  content text not null check (char_length(content) <= 500),
  xp_earned integer not null default 15,
  created_at timestamptz not null default now(),
  unique (user_id, reflection_date)
);

-- RLS Policies
alter table public.profiles enable row level security;
alter table public.habits enable row level security;
alter table public.completions enable row level security;
alter table public.streak_log enable row level security;
alter table public.daily_quests enable row level security;
alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.boss_fights enable row level security;
alter table public.reflections enable row level security;

-- Profiles: users can read/update their own
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Habits: users can CRUD their own
create policy "Users can view own habits" on public.habits for select using (auth.uid() = user_id);
create policy "Users can insert own habits" on public.habits for insert with check (auth.uid() = user_id);
create policy "Users can update own habits" on public.habits for update using (auth.uid() = user_id);
create policy "Users can delete own habits" on public.habits for delete using (auth.uid() = user_id);

-- Completions: users can CRUD their own
create policy "Users can view own completions" on public.completions for select using (auth.uid() = user_id);
create policy "Users can insert own completions" on public.completions for insert with check (auth.uid() = user_id);

-- Streak log: users can view their own
create policy "Users can view own streak_log" on public.streak_log for select using (auth.uid() = user_id);
create policy "Users can insert own streak_log" on public.streak_log for insert with check (auth.uid() = user_id);
create policy "Users can update own streak_log" on public.streak_log for update using (auth.uid() = user_id);

-- Daily quests: users can view/complete their own
create policy "Users can view own quests" on public.daily_quests for select using (auth.uid() = user_id);
create policy "Users can insert own quests" on public.daily_quests for insert with check (auth.uid() = user_id);
create policy "Users can update own quests" on public.daily_quests for update using (auth.uid() = user_id);

-- Guilds: members can view, creator can manage
create policy "Guild members can view guild" on public.guilds for select using (
  exists (select 1 from public.guild_members gm where gm.guild_id = id and gm.user_id = auth.uid())
);
create policy "Anyone can create guild" on public.guilds for insert with check (auth.uid() = created_by);
create policy "Creator can update guild" on public.guilds for update using (auth.uid() = created_by);
create policy "Creator can delete guild" on public.guilds for delete using (auth.uid() = created_by);

-- Guild members: members can view co-members
create policy "Guild members can view members" on public.guild_members for select using (
  exists (select 1 from public.guild_members gm where gm.guild_id = guild_id and gm.user_id = auth.uid())
);
create policy "Users can join guilds" on public.guild_members for insert with check (auth.uid() = user_id);
create policy "Users can leave guilds" on public.guild_members for delete using (auth.uid() = user_id);

-- Boss fights: users can view/manage their own
create policy "Users can view own boss fights" on public.boss_fights for select using (auth.uid() = user_id);
create policy "Users can insert own boss fights" on public.boss_fights for insert with check (auth.uid() = user_id);
create policy "Users can update own boss fights" on public.boss_fights for update using (auth.uid() = user_id);

-- Reflections: users can CRUD their own
create policy "Users can view own reflections" on public.reflections for select using (auth.uid() = user_id);
create policy "Users can insert own reflections" on public.reflections for insert with check (auth.uid() = user_id);

-- Trigger: create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Indexes for performance
create index idx_completions_user_date on public.completions(user_id, completed_date);
create index idx_completions_habit on public.completions(habit_id, completed_date);
create index idx_streak_log_user_date on public.streak_log(user_id, log_date desc);
create index idx_habits_user on public.habits(user_id) where not is_archived;
create index idx_guild_members_user on public.guild_members(user_id);
create index idx_boss_fights_user_week on public.boss_fights(user_id, week_start desc);

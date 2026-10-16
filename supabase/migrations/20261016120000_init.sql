-- Shelby V1. Exécuter dans le SQL editor Supabase, puis supabase/seed/puzzles.sql.

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  chess_rating integer check (chess_rating between 400 and 2800),
  created_at timestamptz not null default now()
);

create table public.schedule_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  weekday smallint not null check (weekday between 0 and 6),
  start_minute integer not null check (start_minute between 0 and 1439),
  end_minute integer not null check (end_minute between 1 and 1440),
  block_type text not null check (block_type in ('work', 'study', 'sport', 'personal', 'admin', 'custom')),
  custom_label text,
  created_at timestamptz not null default now(),
  check (end_minute > start_minute),
  check (block_type <> 'custom' or (custom_label is not null and char_length(btrim(custom_label)) between 1 and 40)),
  unique (id, user_id)
);

create table public.schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  rule_id uuid not null,
  occurrence_date date not null,
  cancelled boolean not null default false,
  title text,
  start_minute integer,
  end_minute integer,
  block_type text,
  custom_label text,
  unique (rule_id, occurrence_date),
  foreign key (rule_id, user_id) references public.schedule_rules (id, user_id) on delete cascade,
  check (block_type is null or block_type in ('work', 'study', 'sport', 'personal', 'admin', 'custom')),
  check (
    cancelled
    or (
      title is not null
      and char_length(btrim(title)) between 1 and 80
      and start_minute is not null
      and end_minute is not null
      and start_minute between 0 and 1439
      and end_minute between 1 and 1440
      and end_minute > start_minute
      and block_type is not null
      and (block_type <> 'custom' or (custom_label is not null and char_length(btrim(custom_label)) between 1 and 40))
    )
  )
);

create table public.schedule_one_offs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  occurrence_date date not null,
  start_minute integer not null check (start_minute between 0 and 1439),
  end_minute integer not null check (end_minute between 1 and 1440),
  block_type text not null check (block_type in ('work', 'study', 'sport', 'personal', 'admin', 'custom')),
  custom_label text,
  created_at timestamptz not null default now(),
  check (end_minute > start_minute),
  check (block_type <> 'custom' or (custom_label is not null and char_length(btrim(custom_label)) between 1 and 40))
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  scheduled_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.weight_entries (
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_date date not null,
  kg numeric(5, 2) not null check (kg > 0 and kg < 500),
  primary key (user_id, entry_date)
);

create table public.sport_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  is_preset boolean not null default false,
  unique (user_id, name),
  unique (id, user_id)
);

create table public.sport_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sport_type_id uuid not null,
  session_date date not null,
  duration_min integer not null check (duration_min > 0 and duration_min <= 1440),
  intensity text not null check (intensity in ('light', 'moderate', 'hard')),
  created_at timestamptz not null default now(),
  foreign key (sport_type_id, user_id) references public.sport_types (id, user_id) on delete restrict
);

create table public.sleep_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  wake_date date not null,
  hours numeric(4, 2) not null check (hours >= 0.25 and hours <= 24),
  quality smallint not null check (quality between 1 and 5),
  primary key (user_id, wake_date)
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  slug text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, slug),
  unique (id, user_id)
);

create table public.habit_logs (
  habit_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  log_date date not null,
  done boolean not null default true,
  primary key (habit_id, log_date),
  foreign key (habit_id, user_id) references public.habits (id, user_id) on delete cascade
);

create table public.metric_definitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  unit text not null check (char_length(btrim(unit)) between 1 and 16),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.metric_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  definition_id uuid not null,
  entry_date date not null,
  value numeric not null,
  unique (definition_id, entry_date),
  foreign key (definition_id, user_id) references public.metric_definitions (id, user_id) on delete cascade
);

create table public.puzzles (
  id text primary key,
  fen text not null,
  moves text not null,
  rating integer not null,
  themes text[] not null default '{}'
);

create table public.puzzle_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  puzzle_id text not null references public.puzzles (id),
  rating_before integer not null,
  rating_after integer not null,
  puzzle_rating integer not null,
  themes text[] not null default '{}',
  correct boolean not null,
  played_at timestamptz not null default now()
);

create index schedule_rules_user_weekday_idx on public.schedule_rules (user_id, weekday);
create index schedule_exceptions_user_date_idx on public.schedule_exceptions (user_id, occurrence_date);
create index schedule_exceptions_rule_idx on public.schedule_exceptions (rule_id);
create index schedule_one_offs_user_date_idx on public.schedule_one_offs (user_id, occurrence_date);
create index tasks_user_date_idx on public.tasks (user_id, scheduled_date);
create index sport_sessions_user_date_idx on public.sport_sessions (user_id, session_date);
create index sport_sessions_type_idx on public.sport_sessions (sport_type_id);
create index habit_logs_user_date_idx on public.habit_logs (user_id, log_date);
create index metric_entries_user_date_idx on public.metric_entries (user_id, entry_date);
create index metric_entries_definition_idx on public.metric_entries (definition_id);
create index puzzles_rating_idx on public.puzzles (rating);
create index puzzle_attempts_user_played_idx on public.puzzle_attempts (user_id, played_at desc);
create index puzzle_attempts_puzzle_idx on public.puzzle_attempts (puzzle_id);

alter table public.profiles enable row level security;
alter table public.schedule_rules enable row level security;
alter table public.schedule_exceptions enable row level security;
alter table public.schedule_one_offs enable row level security;
alter table public.tasks enable row level security;
alter table public.weight_entries enable row level security;
alter table public.sport_types enable row level security;
alter table public.sport_sessions enable row level security;
alter table public.sleep_logs enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.metric_definitions enable row level security;
alter table public.metric_entries enable row level security;
alter table public.puzzles enable row level security;
alter table public.puzzle_attempts enable row level security;

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete on public.puzzles from authenticated;

create policy profiles_own on public.profiles
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy schedule_rules_own on public.schedule_rules
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy schedule_exceptions_own on public.schedule_exceptions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy schedule_one_offs_own on public.schedule_one_offs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy tasks_own on public.tasks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy weight_own on public.weight_entries
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy sport_types_own on public.sport_types
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy sport_sessions_own on public.sport_sessions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy sleep_own on public.sleep_logs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy habits_own on public.habits
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy habit_logs_own on public.habit_logs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy metrics_own on public.metric_definitions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy metric_entries_own on public.metric_entries
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy puzzles_read on public.puzzles
  for select to authenticated
  using (true);

create policy attempts_own on public.puzzle_attempts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict do nothing;
  insert into public.sport_types (user_id, name, is_preset) values
    (new.id, 'Musculation', true),
    (new.id, 'Course', true),
    (new.id, 'Vélo', true),
    (new.id, 'Marche', true),
    (new.id, 'Natation', true)
  on conflict do nothing;
  insert into public.habits (user_id, name, slug) values
    (new.id, 'Lire', 'read'),
    (new.id, 'Étirements / mobilité', 'stretch'),
    (new.id, 'Puzzles d''échecs', 'chess')
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.ensure_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  insert into public.profiles (id) values (uid) on conflict do nothing;
  insert into public.sport_types (user_id, name, is_preset) values
    (uid, 'Musculation', true),
    (uid, 'Course', true),
    (uid, 'Vélo', true),
    (uid, 'Marche', true),
    (uid, 'Natation', true)
  on conflict do nothing;
  insert into public.habits (user_id, name, slug) values
    (uid, 'Lire', 'read'),
    (uid, 'Étirements / mobilité', 'stretch'),
    (uid, 'Puzzles d''échecs', 'chess')
  on conflict do nothing;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.ensure_account() from public, anon;
grant execute on function public.ensure_account() to authenticated;

create or replace function public.next_puzzle(target_rating integer, exclude text[])
returns table (
  id text,
  fen text,
  moves text,
  rating integer,
  themes text[]
)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  window_size integer;
begin
  foreach window_size in array array[150, 300, 600, 5000]
  loop
    return query
      select p.id, p.fen, p.moves, p.rating, p.themes
      from public.puzzles p
      where p.rating between target_rating - window_size and target_rating + window_size
        and not (p.id = any(coalesce(exclude, array[]::text[])))
      order by abs(p.rating - target_rating), random()
      limit 1;
    if found then
      return;
    end if;
  end loop;
end;
$$;

revoke all on function public.next_puzzle(integer, text[]) from public, anon;
grant execute on function public.next_puzzle(integer, text[]) to authenticated;

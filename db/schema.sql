-- Goal Coach minimum schema (Postgres)
-- Aligned to docs/api-contract.openapi.yaml and locked table list.

create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  timezone text not null,
  phone_e164 text,
  phone_verified boolean not null default false,
  consent_flags jsonb not null,
  preferences jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  statement text not null,
  motivation text not null,
  constraints text,
  target_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  goal_id uuid not null references goals(id) on delete cascade,
  title text not null,
  frequency jsonb not null,
  measurement jsonb not null,
  difficulty_1_to_10 integer not null check (difficulty_1_to_10 between 1 and 10),
  default_time_window jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  habit_id uuid not null references habits(id) on delete cascade,
  date_local date not null,
  status text not null check (status in ('done', 'partial', 'missed', 'skipped')),
  value numeric,
  note text,
  source text not null default 'manual' check (source in ('manual', 'chat_auto', 'call_tool')),
  created_at timestamptz not null default now()
);

create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  type text not null check (type in ('call', 'chat')),
  windows jsonb not null,
  cadence jsonb not null,
  retry_policy jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists schedules_user_type_idx on schedules (user_id, type);

create table if not exists checkin_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  scheduled_at_utc timestamptz not null,
  type text not null check (type in ('call', 'chat')),
  status text not null check (status in ('scheduled', 'in_progress', 'completed', 'failed', 'no_answer')),
  attempt_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  thread_id uuid not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists call_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  checkin_event_id uuid references checkin_events(id) on delete set null,
  status text not null check (status in ('completed', 'failed', 'no_answer')),
  started_at timestamptz,
  ended_at timestamptz,
  transcript text,
  created_at timestamptz not null default now()
);

create table if not exists call_outcomes (
  id uuid primary key default gen_random_uuid(),
  call_session_id uuid not null unique references call_sessions(id) on delete cascade,
  completed_habits uuid[] not null default '{}',
  missed_habits uuid[] not null default '{}',
  blockers text[] not null default '{}',
  commitments text[] not null default '{}',
  recap_text text,
  created_at timestamptz not null default now()
);

create table if not exists weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  week_start_date date not null,
  completion_stats jsonb not null,
  summary text,
  plan_changes_json jsonb,
  status text not null check (status in ('pending_approval', 'approved', 'rejected')),
  generated_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, week_start_date)
);

create table if not exists memory_profile (
  user_id uuid primary key references users(id) on delete cascade,
  stable_facts jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists memory_embeddings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  chunk_id text not null,
  text text not null,
  metadata jsonb,
  vector vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists habit_logs_user_date_idx on habit_logs (user_id, date_local);
create index if not exists checkin_events_due_idx on checkin_events (scheduled_at_utc, status);
create index if not exists messages_user_thread_idx on messages (user_id, thread_id, created_at);

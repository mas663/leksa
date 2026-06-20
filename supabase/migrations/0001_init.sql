-- Migration: 0001_init
-- Tabel cards + RLS untuk aplikasi flashcard Leksa.
-- Sudah dijalankan di Supabase dashboard. File ini hanya arsip.

create table if not exists cards (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  word           text        not null,
  translation    text,
  part_of_speech text,
  example_en     text,
  example_id     text,
  grammar_note   text,
  source         text        not null default 'manual' check (source in ('ai', 'manual')),

  -- Leitner / spaced repetition
  box            int         not null default 1,
  next_review    timestamptz not null default now(),

  -- Statistik & meta
  times_correct  int         not null default 0,
  times_wrong    int         not null default 0,
  created_at     timestamptz not null default now(),
  last_reviewed  timestamptz
);

create index if not exists cards_user_due_idx on cards (user_id, next_review);

-- Row Level Security
alter table cards enable row level security;

create policy "select own cards" on cards
  for select using (auth.uid() = user_id);

create policy "insert own cards" on cards
  for insert with check (auth.uid() = user_id);

create policy "update own cards" on cards
  for update using (auth.uid() = user_id);

create policy "delete own cards" on cards
  for delete using (auth.uid() = user_id);

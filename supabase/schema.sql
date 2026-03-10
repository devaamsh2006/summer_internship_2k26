-- ═══════════════════════════════════════════════════════════════════
-- AI Resume Intelligence Platform — Supabase Schema
-- Run this SQL in the Supabase SQL Editor to create the tables.
-- ═══════════════════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── Analyses Table ─────────────────────────────────────────────
create table if not exists analyses (
  id                uuid        primary key default uuid_generate_v4(),
  resume_file_name  text        not null,
  resume_text       text        not null,
  resume_sections   jsonb       default '{}'::jsonb,
  resume_skills     jsonb       default '[]'::jsonb,
  job_description   text        not null,
  jd_skills         jsonb       default '[]'::jsonb,
  overall_score     float       not null default 0,
  section_scores    jsonb       default '{}'::jsonb,
  missing_skills    jsonb       default '[]'::jsonb,
  keyword_analysis  jsonb       default '{}'::jsonb,
  ats_score         float       not null default 0,
  strength_score    float       not null default 0,
  improvements      jsonb       default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Index for listing analyses by date
create index if not exists idx_analyses_created_at on analyses (created_at desc);

-- Auto-update updated_at on row change
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_analyses_updated_at
  before update on analyses
  for each row execute function update_updated_at_column();

-- ─── Generated Resumes Table ────────────────────────────────────
create table if not exists generated_resumes (
  id              uuid        primary key default uuid_generate_v4(),
  name            text        not null,
  content         text        not null,
  job_description text        not null,
  created_at      timestamptz not null default now()
);

-- Index for listing resumes by date
create index if not exists idx_generated_resumes_created_at on generated_resumes (created_at desc);

-- ─── Row Level Security (optional — enable if needed) ───────────
-- alter table analyses enable row level security;
-- alter table generated_resumes enable row level security;

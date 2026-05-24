-- Vault initial schema
-- Run this in the Supabase SQL editor after creating the project.

create extension if not exists vector;
create extension if not exists pgcrypto;

-- codes: directory entries
create table codes (
  id uuid primary key default gen_random_uuid(),
  source_url text not null,
  source_type text not null, -- 'github-awesome' | 'github-topic' | 'huggingface' | 'reddit' | 'manual'
  title text not null,
  description text,
  ai_platforms text[] default array[]::text[], -- ['claude','gpt','gemini','groq','llama','mistral']
  delivery_targets text[] default array[]::text[], -- ['telegram','slack','discord','whatsapp','imessage']
  install_command text,
  language text,
  github_url text,
  stars integer default 0,
  license text,
  author text,
  last_verified_at timestamptz,
  last_verified_status text, -- 'working' | 'broken' | 'unverified'
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved boolean default false,
  category text,
  embedding vector(1536)
);

create unique index codes_source_url_uidx on codes(source_url);
create index codes_ai_platforms_idx on codes using gin(ai_platforms);
create index codes_delivery_targets_idx on codes using gin(delivery_targets);
create index codes_approved_idx on codes(approved) where approved = true;
create index codes_stars_idx on codes(stars desc);
create index codes_added_at_idx on codes(added_at desc);

-- subscribers: paywall state
create table subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  ls_subscription_id text unique,
  ls_customer_id text,
  status text not null default 'inactive', -- 'active' | 'inactive' | 'cancelled' | 'past_due'
  plan text, -- 'monthly' | 'annual'
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscribers_user_id_uidx on subscribers(user_id);

-- saved_codes: user bookmarks
create table saved_codes (
  user_id uuid references auth.users(id) on delete cascade,
  code_id uuid references codes(id) on delete cascade,
  notes text,
  saved_at timestamptz not null default now(),
  primary key (user_id, code_id)
);

-- scrape_runs: audit trail for daily cron
create table scrape_runs (
  id uuid primary key default gen_random_uuid(),
  source_type text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  entries_found integer default 0,
  entries_new integer default 0,
  entries_updated integer default 0,
  errors text[]
);

-- Row level security
alter table codes enable row level security;
alter table subscribers enable row level security;
alter table saved_codes enable row level security;

-- Public read of approved codes
create policy "codes_public_read" on codes
  for select using (approved = true);

-- Users see their own subscription row
create policy "subscribers_self_read" on subscribers
  for select using (auth.uid() = user_id);

-- Users manage their own saved entries
create policy "saved_codes_self_all" on saved_codes
  for all using (auth.uid() = user_id);

-- Semantic search RPC: cosine distance against codes.embedding.
-- Returns top-k approved entries with their similarity score.
create or replace function search_codes(
  query_embedding vector(1536),
  match_count int default 5,
  min_similarity float default 0.0
) returns table (
  id uuid,
  title text,
  description text,
  ai_platforms text[],
  delivery_targets text[],
  install_command text,
  github_url text,
  stars integer,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.title,
    c.description,
    c.ai_platforms,
    c.delivery_targets,
    c.install_command,
    c.github_url,
    c.stars,
    1 - (c.embedding <=> query_embedding) as similarity
  from codes c
  where c.approved = true
    and c.embedding is not null
    and 1 - (c.embedding <=> query_embedding) >= min_similarity
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

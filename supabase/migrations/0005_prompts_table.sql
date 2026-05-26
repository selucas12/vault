-- Prompts library table.
-- Stores AI prompts scraped from public sources, quality-scored and searchable.

create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  source varchar(50) not null,
  source_url text not null,
  ai_platforms text[] not null default '{}',
  use_case varchar(100),
  category varchar(100),
  tags text[] not null default '{}',
  embedding vector(1536),
  quality_score smallint,
  quality_reasoning text,
  hidden_from_directory boolean not null default true,
  is_free boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists prompts_source_url_idx on prompts(source_url);
create index if not exists prompts_ai_platforms_idx on prompts using gin(ai_platforms);
create index if not exists prompts_use_case_idx on prompts(use_case);
create index if not exists prompts_category_idx on prompts(category);
create index if not exists prompts_quality_score_idx on prompts(quality_score desc);
create index if not exists prompts_hidden_idx on prompts(hidden_from_directory) where hidden_from_directory = false;
create index if not exists prompts_embedding_idx on prompts using ivfflat (embedding vector_cosine_ops) with (lists = 50);

-- Content-hash index for deduplication.
create unique index if not exists prompts_content_hash_idx on prompts(md5(lower(regexp_replace(body, '\s+', '', 'g'))));

-- RPC for vector search over prompts.
create or replace function search_prompts(
  query_embedding vector(1536),
  match_count int default 5,
  min_quality_score int default 6
)
returns table (
  id uuid,
  title text,
  body text,
  source varchar,
  source_url text,
  ai_platforms text[],
  use_case varchar,
  category varchar,
  tags text[],
  quality_score smallint,
  is_free boolean,
  similarity float
)
language sql stable
as $$
  select
    p.id,
    p.title,
    p.body,
    p.source,
    p.source_url,
    p.ai_platforms,
    p.use_case,
    p.category,
    p.tags,
    p.quality_score,
    p.is_free,
    (1 - (p.embedding <=> query_embedding)) as similarity
  from prompts p
  where p.hidden_from_directory = false
    and p.embedding is not null
    and p.quality_score >= min_quality_score
    and (1 - (p.embedding <=> query_embedding)) > 0.1
  order by similarity desc
  limit match_count;
$$;

grant execute on function search_prompts to anon, authenticated, service_role;

-- Enable RLS (service role bypasses).
alter table prompts enable row level security;
create policy "Public read visible prompts" on prompts for select using (hidden_from_directory = false);
create policy "Service role full access" on prompts for all using (true) with check (true);
-- Grant service_role bypass for scraper/scorer writes.
grant all on prompts to service_role;

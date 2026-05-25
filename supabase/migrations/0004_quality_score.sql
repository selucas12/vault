-- Quality scoring columns for automated entry filtering.
-- Entries below threshold are hidden from public view but kept for re-evaluation.

alter table codes
  add column if not exists quality_score smallint,
  add column if not exists quality_reasoning text,
  add column if not exists hidden_from_directory boolean not null default false;

create index if not exists codes_quality_score_idx on codes(quality_score desc);
create index if not exists codes_hidden_idx on codes(hidden_from_directory) where hidden_from_directory = false;

-- Update search_codes to exclude hidden entries.
drop function if exists search_codes(vector(1536), int, float, text[], text[]);

create or replace function search_codes(
  query_embedding vector(1536),
  match_count int default 5,
  min_similarity float default 0.1,
  target_filter text[] default null,
  platform_filter text[] default null
)
returns table (
  id uuid,
  title text,
  description text,
  source_url text,
  install_command text,
  ai_platforms text[],
  delivery_targets text[],
  stars int,
  language text,
  license text,
  featured boolean,
  editor_note text,
  github_url text,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.title,
    c.description,
    c.source_url,
    c.install_command,
    c.ai_platforms,
    c.delivery_targets,
    c.stars,
    c.language,
    c.license,
    c.featured,
    c.editor_note,
    c.github_url,
    (1 - (c.embedding <=> query_embedding))
      + (case when target_filter is not null and c.delivery_targets && target_filter then 0.3 else 0 end)
      + (case when platform_filter is not null and c.ai_platforms && platform_filter then 0.2 else 0 end)
      + (case when c.featured then 0.05 else 0 end)
      as similarity
  from codes c
  where c.approved = true
    and c.hidden_from_directory = false
    and c.embedding is not null
    and (1 - (c.embedding <=> query_embedding)) > min_similarity
  order by similarity desc
  limit match_count;
$$;

grant execute on function search_codes to anon, authenticated, service_role;

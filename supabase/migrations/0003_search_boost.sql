-- Tier 11c: Improved search ranking with target/platform boost + filters.
-- Replaces the original search_codes function with a version that accepts
-- optional target_filter and platform_filter arrays. When present, matching
-- entries get a similarity boost (+0.3 for target, +0.2 for platform,
-- +0.05 for featured). This corrects the problem where vector similarity
-- over-weighted AI platform at the expense of delivery target.
--
-- Apply via Supabase SQL editor after 0001_init.sql and 0002_featured.sql.

drop function if exists search_codes(vector(1536), int, float);

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
    and c.embedding is not null
    and (1 - (c.embedding <=> query_embedding)) > min_similarity
  order by similarity desc
  limit match_count;
$$;

grant execute on function search_codes to anon, authenticated, service_role;

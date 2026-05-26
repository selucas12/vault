-- Install guides: structured documentation for each integration.
-- Adds guide content, authorship, and community feedback columns.

alter table codes add column if not exists install_guide text;
alter table codes add column if not exists install_guide_status text default 'missing'
  check (install_guide_status in ('missing','draft','verified','broken'));
alter table codes add column if not exists install_guide_author text;
alter table codes add column if not exists install_guide_updated_at timestamptz;
alter table codes add column if not exists install_guide_helpful_count int default 0;
alter table codes add column if not exists install_guide_error_reports int default 0;

create index if not exists idx_codes_install_guide_status on codes(install_guide_status);

-- Feedback log for error reports on install guides.
create table if not exists install_guide_feedback (
  id uuid primary key default gen_random_uuid(),
  code_id uuid references codes(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);

alter table install_guide_feedback enable row level security;

create policy "guide_feedback_insert" on install_guide_feedback
  for insert with check (auth.uid() = user_id);

create policy "guide_feedback_self_read" on install_guide_feedback
  for select using (auth.uid() = user_id);

-- Mark all hidden entries as needing a guide.
update codes set install_guide_status = 'missing' where hidden_from_directory = true;

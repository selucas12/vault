-- Tier 7: featured entries + editor notes
-- Apply AFTER 0001_init.sql.
-- Idempotent: each statement uses IF NOT EXISTS.

alter table codes
  add column if not exists featured boolean default false,
  add column if not exists editor_note text;

create index if not exists codes_featured_idx
  on codes(featured)
  where featured = true;

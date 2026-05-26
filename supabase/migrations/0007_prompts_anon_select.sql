-- Fix: grant anon and authenticated roles SELECT on prompts table.
-- RLS policy "Public read visible prompts" already filters to
-- hidden_from_directory = false. Body gating is handled in the UI layer.

grant select on prompts to anon, authenticated;

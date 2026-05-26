-- Idempotency table for LS webhook events.
-- Prevents double-processing of out-of-order or replayed events.

create table if not exists processed_webhooks (
  id text primary key,
  processed_at timestamptz not null default now()
);

alter table processed_webhooks enable row level security;
grant insert, select on processed_webhooks to service_role;

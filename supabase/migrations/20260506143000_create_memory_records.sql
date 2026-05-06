create table if not exists public.memory_records (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'generic',
  content text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

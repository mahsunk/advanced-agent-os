alter table public.project_runs
  add column if not exists created_at timestamptz not null default now();

alter table public.file_changes
  add column if not exists created_at timestamptz not null default now();

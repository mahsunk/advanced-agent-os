create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prompt text not null default '',
  status text not null default 'created',
  github_repo text,
  branch_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_runs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  prompt text not null default '',
  status text not null default 'created',
  agent_summary text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.file_changes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  run_id uuid references public.project_runs(id) on delete cascade,
  path text not null,
  action text not null default 'create',
  old_content text,
  new_content text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists projects_created_at_idx on public.projects(created_at desc);
create index if not exists project_runs_project_id_idx on public.project_runs(project_id);
create index if not exists file_changes_project_id_idx on public.file_changes(project_id);
create index if not exists file_changes_run_id_idx on public.file_changes(run_id);

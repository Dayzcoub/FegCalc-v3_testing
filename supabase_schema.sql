-- FEG Stage PRO 2.2 — Supabase schema
-- Создай эту таблицу в Supabase SQL Editor.
-- Для быстрого старта можно использовать эти политики для anon-доступа.
-- Для production лучше подключить Supabase Auth и заменить политики на auth.uid().

create extension if not exists "pgcrypto";

create table if not exists public.projects (
    id uuid primary key default gen_random_uuid(),
    workspace_key text not null,
    local_id text,
    order_id text,
    client text,
    name text,
    total numeric default 0,
    project_data jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists projects_workspace_updated_idx
on public.projects (workspace_key, updated_at desc);

create unique index if not exists projects_workspace_local_id_idx
on public.projects (workspace_key, local_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_updated_at on public.projects;

create trigger trg_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

alter table public.projects enable row level security;

-- Простые политики для PWA без авторизации.
-- Доступ фактически ограничивается секретностью Supabase anon key + workspace_key.
-- Если приложение будет использоваться командой/клиентами, лучше перейти на Supabase Auth.
drop policy if exists "feg_projects_select" on public.projects;
drop policy if exists "feg_projects_insert" on public.projects;
drop policy if exists "feg_projects_update" on public.projects;
drop policy if exists "feg_projects_delete" on public.projects;

create policy "feg_projects_select"
on public.projects for select
to anon
using (true);

create policy "feg_projects_insert"
on public.projects for insert
to anon
with check (true);

create policy "feg_projects_update"
on public.projects for update
to anon
using (true)
with check (true);

create policy "feg_projects_delete"
on public.projects for delete
to anon
using (true);

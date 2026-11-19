-- wedding-moments: uploads table + RLS (contracts/supabase-schema.md)

create table if not exists public.uploads (
  id          uuid primary key default gen_random_uuid(),
  owner       uuid not null default auth.uid(),
  guest_name  text check (guest_name is null or char_length(guest_name) <= 80),
  kind        text not null check (kind in ('photo', 'video')),
  path        text not null unique,          -- {owner}/{id}.{ext}
  thumb_path  text,                          -- {owner}/{id}_t.jpg
  mime        text not null,
  size_bytes  bigint not null check (size_bytes > 0),
  is_public   boolean not null default false, -- v1.1: share with all guests (ADR-006)
  created_at  timestamptz not null default now(),
  constraint uploads_path_in_owner_folder check (path like owner::text || '/%'),
  constraint uploads_thumb_in_owner_folder check (thumb_path is null or thumb_path like owner::text || '/%')
);

create index if not exists uploads_owner_created_idx on public.uploads (owner, created_at desc);

alter table public.uploads enable row level security;

revoke all on public.uploads from anon, authenticated;
grant select, insert, delete on public.uploads to authenticated;

drop policy if exists "insert own" on public.uploads;
create policy "insert own" on public.uploads
  for insert to authenticated
  with check (owner = auth.uid() and is_public = false);

drop policy if exists "read own or public" on public.uploads;
create policy "read own or public" on public.uploads
  for select to authenticated
  using (owner = auth.uid() or is_public);

drop policy if exists "delete own" on public.uploads;
create policy "delete own" on public.uploads
  for delete to authenticated
  using (owner = auth.uid());

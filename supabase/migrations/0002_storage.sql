-- wedding-moments: private bucket `media` + storage policies (contracts/supabase-schema.md)
-- NOTE: bucket file_size_limit cannot exceed the project's global upload limit
-- (Storage → Settings). Free plan caps at 50 MB — use Pro around the event (research R3).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', false, 52428800, -- 50 MB (free plan). Pro: raise to 2147483648
        array['image/*', 'video/*'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media insert own folder" on storage.objects;
create policy "media insert own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "media read own folder" on storage.objects;
create policy "media read own folder" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- v1.1 shared gallery: objects whose upload row is marked public
drop policy if exists "media read public" on storage.objects;
create policy "media read public" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'media'
    and exists (
      select 1 from public.uploads u
      where u.is_public and (u.path = storage.objects.name or u.thumb_path = storage.objects.name)
    )
  );

drop policy if exists "media delete own folder" on storage.objects;
create policy "media delete own folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

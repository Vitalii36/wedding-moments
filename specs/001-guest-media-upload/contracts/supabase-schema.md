# Contract: Supabase schema & policies

Source of truth: `supabase/migrations/`.

## Table `public.uploads`
See data-model.md. RLS enabled. Grants: `authenticated` may `select, insert, delete`; no `update`.

| Policy | Command | Rule |
|--------|---------|------|
| insert own | INSERT | `owner = auth.uid() and is_public = false` |
| read own or public | SELECT | `owner = auth.uid() or is_public` |
| delete own | DELETE | `owner = auth.uid()` |

`anon` role (no session): no grants → nothing.

## Bucket `media`
`public = false`, `file_size_limit = 2147483648`, `allowed_mime_types = {image/*, video/*}`.

| Policy (storage.objects) | Command | Rule |
|--------------------------|---------|------|
| media insert own folder | INSERT | `bucket_id='media' and (storage.foldername(name))[1] = auth.uid()::text` |
| media read own folder | SELECT | same |
| media read public | SELECT | `bucket_id='media' and exists(select 1 from uploads u where u.is_public and (u.path = name or u.thumb_path = name))` |
| media delete own folder | DELETE | same as insert |

TUS resumable uploads additionally need SELECT on own folder (included) and no UPDATE (no upsert).

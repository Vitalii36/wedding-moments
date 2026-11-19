# Data Model

## Guest (implicit)
- Supabase anonymous auth user. Identity = `auth.uid()`.
- `guest_name` is stored client-side (localStorage key `wm.guestName`) and copied onto each upload.

## Upload (`public.uploads`)

| Field | Type | Rules |
|-------|------|-------|
| id | uuid PK | generated client-side (`crypto.randomUUID()`) so the object path is known before insert; default `gen_random_uuid()` |
| owner | uuid | default `auth.uid()`; must equal `auth.uid()` on insert |
| guest_name | text null | trimmed, ≤ 80 chars (check constraint) |
| kind | text | `photo` \| `video` |
| path | text | `{owner}/{id}.{ext}`; must start with `owner::text || '/'` (check) |
| thumb_path | text null | `{owner}/{id}_t.jpg` |
| mime | text | browser-reported type, fallback by extension |
| size_bytes | bigint | > 0 |
| is_public | boolean | default false; not writable by guests (v1.1 flag) |
| created_at | timestamptz | default now() |

### Lifecycle
`selected → (thumb generated | thumb failed) → uploading (progress %) → uploaded → recorded` ;
any step may go to `error` → `retry` restarts from the failed step (TUS resumes bytes).
Delete: remove storage objects (original + thumb) then delete row (RLS ensures ownership).

### Client-side upload item (not persisted)
`{ localId, file, kind, status: 'queued'|'thumb'|'uploading'|'saving'|'done'|'error', progress 0..1, error?, uploadId }`

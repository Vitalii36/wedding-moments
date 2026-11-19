# Phase 0 Research: Guest Media Upload

## R1. Resumable uploads to Supabase Storage
- **Decision**: `tus-js-client` → `https://<ref>.storage.supabase.co/storage/v1/upload/resumable`
  (direct storage hostname), `chunkSize: 6 * 1024 * 1024` (Supabase requires exactly 6 MB),
  headers `authorization: Bearer <access_token>`, `x-upsert: false`, metadata
  `bucketName`, `objectName`, `contentType`, `cacheControl`. `retryDelays: [0, 3000, 5000, 10000, 20000, 30000, 60000]`.
  Fingerprints stored in localStorage by tus so re-selecting the same file resumes.
- **Rationale**: official Supabase-documented path; same code path for small and big files (ADR-003).
- **Alternatives**: `supabase.storage.upload()` (not resumable); Uppy (heavier UI dependency).
- **Note**: the access token can expire during a long upload; refresh before each file and in
  `onBeforeRequest` read the current session token.

## R2. Anonymous auth
- **Decision**: `supabase.auth.signInAnonymously()` on first load if no session; session persisted
  in localStorage by supabase-js. Anonymous users have role `authenticated` with
  `is_anonymous` claim, so policies use `auth.uid()`.
- **Requirement**: enable "Anonymous sign-ins" in Auth settings. Consider enabling CAPTCHA if abuse
  appears (not in v1). Disable after the event (runbook).

## R3. Limits and plan (ADR-008)
- **Decision**: bucket `file_size_limit = 2 GB` (2147483648), `allowed_mime_types = {image/*, video/*}`.
  Free plan caps per-file size at 50 MB → the project MUST be on Pro (or higher) around the event,
  and the global upload size limit in Storage settings raised ≥ bucket limit.
- **Action before event**: verify current Supabase pricing/limits (storage GB included, egress,
  global max file size). Recorded in `docs/after-wedding.md` checklist.

## R4. Thumbnails (ADR-004)
- **Photos**: `createImageBitmap(file, { imageOrientation: 'from-image' })` when available, else
  `<img>` decode; draw to canvas with longest side 480 px; `toBlob('image/jpeg', 0.8)`.
  Safari decodes HEIC natively; Chrome on Android usually never produces HEIC. On failure → null.
- **Videos**: `<video muted playsinline preload="metadata">` with object URL, seek to
  `min(1, duration/2)`, wait `seeked`, draw frame; timeout 8 s → null. Browsers apply rotation
  metadata to `videoWidth/videoHeight`, so portrait is preserved.
- Thumbnail always JPEG at `{owner}/{id}_t.jpg`.

## R5. Concurrency
- **Decision**: tiny in-house promise queue with limit 2 (pure, unit-tested). Avoids a dependency.

## R6. Viewing
- **Decision**: `createSignedUrls(thumbPaths, 3600)` for the grid; on open,
  `createSignedUrl(path, 3600)` for the original. Videos use `<video controls playsinline>`.

## R7. Styling & fonts
- **Decision**: Tailwind 4 via `@tailwindcss/vite`, theme tokens in `@theme`; font
  `@fontsource/cormorant-garamond` (400, 500, 400-italic; has Cyrillic). The "та" accent uses
  Cormorant Garamond italic.
- **Rejected**: Pinyon Script (PLAN §5) — it has no Cyrillic glyphs, and "та" is Cyrillic.
- Olive branches are an inline SVG placeholder until the invitation artwork is supplied
  (`src/assets/olive.svg` is the swap point).

## R8. Deployment
- **Decision**: GitHub Actions → `actions/deploy-pages`; Vite `base` from `VITE_BASE` (default
  `/wedding-moments/`). Supabase URL + anon key injected from repository Variables
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) — anon key is public by design.

## R9. Export
- **Decision**: `scripts/export.py` as a PEP 723 inline-metadata script run with
  `uv run scripts/export.py`, using `httpx` against Storage REST + PostgREST with the service key
  (avoids the heavy `supabase` Python SDK). Downloads stream to `export/<guest>/<created>_<id>.<ext>`,
  skips existing files with matching size. Prints count check (records vs files).

## R10. RLS test
- **Decision**: `scripts/rls-test.mjs` (Node, uses supabase-js): creates two anonymous sessions,
  A uploads a small object + row, asserts B cannot select/delete/download it, anon (no session)
  cannot select; cleans up. Requires anonymous sign-ins enabled on the target project.

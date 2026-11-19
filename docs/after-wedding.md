# Runbook

## Before the event (T-2 weeks)

- [ ] Supabase project on **Pro** (free plan caps files at 50 MB). Check current pricing,
      included storage (expect 20–40 GB) and egress.
- [ ] Storage → Settings → global upload size limit ≥ 2 GB (bucket limit in `0002_storage.sql`).
- [ ] Auth → **Anonymous sign-ins: ON**.
- [ ] Migrations applied (`supabase/migrations/0001_uploads.sql`, `0002_storage.sql`).
- [ ] `npm run rls-test` → "All RLS checks passed".
- [ ] Deployed site opens from QR on iPhone and Android (`docs/device-test-checklist.md` done).
- [ ] Print QR cards: `npm run qr-card -- https://<user>.github.io/wedding-moments/`, open
      `docs/qr-card.html`, print A4 with no margins, cut into 4.
- [ ] Do a dry-run export (`uv run scripts/export.py --dry-run`).

## After the event

1. **Stop new uploads** (next day or after a few days for late uploads):
   Auth → Providers → **Anonymous sign-ins: OFF**. Existing guests keep their sessions until
   expiry; to stop everything immediately, also set the bucket to reject uploads:
   ```sql
   update storage.buckets set allowed_mime_types = array['application/x-none'] where id = 'media';
   ```
2. **Export** originals:
   ```bash
   uv run scripts/export.py --out export
   ```
   It must end with `failed=0` and `on_disk == records`. Re-run to resume; it skips finished files.
3. **Back up** the `export/` folder to two places (external disk + cloud).
4. *(Optional, v1.1)* share selected media with all guests:
   ```sql
   update public.uploads set is_public = true where id in (...);
   ```
   then add the "Усі моменти" tab (ADR-006).
5. **Downgrade** the Supabase plan only after the backup is verified. Delete the bucket contents
   if you no longer want them stored there.
6. Decide how long the site stays online; to take it down, disable GitHub Pages.

# Contract: `scripts/export.py`

```
uv run scripts/export.py [--out export] [--dry-run]
```

Env (from `.env` in repo root, git-ignored): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

Behaviour:
1. Pages through `GET /rest/v1/uploads?select=*&order=created_at` (1000 per page).
2. For each row downloads `GET /storage/v1/object/media/{path}` (streamed) into the layout in
   storage-layout.md; skips when the target exists with the same size.
3. Prints `records=N downloaded=D skipped=S failed=F` and exits non-zero if `F > 0` or the number
   of files on disk for these records ≠ N.

# Contract: `scripts/rls-test.mjs`
```
SUPABASE_URL=… SUPABASE_ANON_KEY=… node scripts/rls-test.mjs
```
Exit 0 when all isolation assertions pass; prints each assertion.

# Contract: `scripts/qr-card.mjs`
```
node scripts/qr-card.mjs https://<user>.github.io/wedding-moments/
```
Writes `docs/qr-card.html` (A6 cards, 4 per A4, print-ready) with an inline SVG QR.

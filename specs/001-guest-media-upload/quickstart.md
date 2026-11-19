# Quickstart

## 1. Supabase
1. Create a project (Pro plan around the event — see research R3).
2. Auth → Sign In / Providers → enable **Anonymous sign-ins**.
3. Storage → Settings → global upload limit ≥ 2 GB.
4. SQL editor: run `supabase/migrations/0001_uploads.sql`, then `0002_storage.sql`
   (or `supabase db push` with the CLI).

## 2. Local dev
```bash
cp .env.example .env          # fill VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (+ service key for scripts)
npm install
npm run dev                   # http://localhost:5173/wedding-moments/
npm run test && npm run typecheck && npm run build
```

## 3. Verify isolation
```bash
node --env-file=.env scripts/rls-test.mjs
```

## 4. Deploy
GitHub repo `wedding-moments` → Settings → Pages → Source: GitHub Actions.
Settings → Variables → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Push to `main`.

## 5. QR card
```bash
node scripts/qr-card.mjs https://<user>.github.io/wedding-moments/
open docs/qr-card.html        # print
```

## 6. After the wedding
See `docs/after-wedding.md`.

## Local full stack (Docker)
```bash
npm run db:start              # local Supabase with migrations applied, anon sign-ins on
# create .env.local-supabase from the keys printed by db:start (see .env.example names)
npm run e2e:local             # RLS isolation + resumable upload test
npm run dev:local             # app against local Supabase
npm run db:stop
```

---
description: "Task list for Guest Media Upload"
---

# Tasks: Guest Media Upload ("wedding-moments")

**Input**: `specs/001-guest-media-upload/` (plan, spec, research, data-model, contracts)
**Tests**: Unit tests for pure logic and the RLS isolation script are required by the constitution.

## Phase 1: Setup

- [ ] T001 Create Vite + Vue 3 + TS project files: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` (with `noindex`), `src/main.ts`, `src/env.d.ts`
- [ ] T002 [P] Add Tailwind 4 + self-hosted Cormorant Garamond in `src/style.css` with theme tokens from PLAN §5
- [ ] T003 [P] Add `.gitignore`, `.env.example`, Vitest config in `vite.config.ts`
- [ ] T004 [P] Add `src/config.ts` (names, date, copy, limits, site URL)

## Phase 2: Foundational

- [ ] T005 Write `supabase/migrations/0001_uploads.sql` (table, checks, RLS, grants)
- [ ] T006 Write `supabase/migrations/0002_storage.sql` (bucket `media`, limits, storage policies)
- [ ] T007 [P] Implement `src/lib/supabase.ts` (client, `ensureSession()`)
- [ ] T008 [P] Implement pure `src/lib/media.ts` (kind detection, extension, validation, object paths) + `tests/unit/media.test.ts`
- [ ] T009 [P] Implement pure `src/lib/queue.ts` (concurrency-limited runner) + `tests/unit/queue.test.ts`

## Phase 3: User Story 1 — Upload (P1) 🎯 MVP

**Independent test**: select 5 photos + 1 video on a phone → all 6 originals in bucket, rows in table.

- [ ] T010 [P] [US1] Implement `src/lib/tusUpload.ts` (Supabase resumable endpoint, 6 MB chunks, fresh token, resume from previous uploads)
- [ ] T011 [P] [US1] Implement `src/lib/thumbnail.ts` (image + video poster, 480 px JPEG, timeout, null on failure) + sizing helper tested in `tests/unit/media.test.ts`
- [ ] T012 [US1] Implement `src/lib/uploads.ts` `uploadOne()` pipeline: thumb → TUS original → thumb upload → insert row; retry-safe
- [ ] T013 [US1] Implement `src/components/UploadList.vue` (per-file progress, status, retry)
- [ ] T014 [US1] Wire upload button + file input + queue in `src/App.vue`

## Phase 4: User Story 2 — My moments (P2)

**Independent test**: reload → grid shows same items; delete → gone from table and bucket.

- [ ] T015 [US2] Add `listMine()`, `signedThumbs()`, `signedOriginal()`, `deleteUpload()` to `src/lib/uploads.ts`
- [ ] T016 [P] [US2] Implement `src/components/Gallery.vue` (grid, placeholders, newest first)
- [ ] T017 [P] [US2] Implement `src/components/Viewer.vue` (full-screen photo/video, delete with confirm, Esc/close)
- [ ] T018 [US2] Wire gallery refresh after uploads in `src/App.vue`

## Phase 5: User Story 3 — Guest name (P3)

- [ ] T019 [US3] Implement `src/components/NameField.vue` persisted in localStorage `wm.guestName`, passed into uploads

## Phase 6: User Story 4 — Export (P2)

- [ ] T020 [US4] Implement `scripts/export.py` per `contracts/export-cli.md`
- [ ] T021 [P] [US4] Write `docs/after-wedding.md` runbook (export, disable anon sign-in, downgrade plan, optional is_public)

## Phase 7: User Story 5 — QR card (P3)

- [ ] T022 [US5] Implement `scripts/qr-card.mjs` → `docs/qr-card.html`

## Phase 8: Polish & cross-cutting

- [ ] T023 [P] Implement `src/components/Hero.vue` + `src/assets/olive.svg` (design PLAN §5)
- [ ] T024 [P] Implement `scripts/rls-test.mjs` two-session isolation test
- [ ] T025 [P] Add `.github/workflows/deploy.yml` (test, typecheck, build, deploy Pages)
- [ ] T026 [P] Write `docs/device-test-checklist.md` (PLAN §6 tests 2–6)
- [ ] T027 Write `README.md` (about, setup, scripts) linking quickstart
- [ ] T028 Run `npm run test`, `npm run typecheck`, `npm run build`; fix issues; check bundle size

## Dependencies

Setup → Foundational → US1 → US2 → US3; US4, US5 depend only on Foundational (T005–T006).
Polish tasks T023–T026 can run any time after Setup.

## Parallel examples

- After T004: T007, T008, T009 in parallel.
- In US1: T010 and T011 in parallel, then T012.
- In US2: T016 and T017 in parallel after T015.

## Implementation strategy

MVP = Phases 1–3 (guests can upload). Then US2 (confidence + delete), US4 (export — must exist
before the event), US3/US5, polish. Validate with device checklist before printing QR codes.

# Implementation Plan: Guest Media Upload ("wedding-moments")

**Branch**: `001-guest-media-upload` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/001-guest-media-upload/spec.md`; product plan `PLAN.md`.

## Summary

A single-page Vue 3 app hosted on GitHub Pages lets wedding guests anonymously sign in to
Supabase, upload photos/videos straight to a private Storage bucket via TUS (resumable), store a
client-generated thumbnail next to each original, and record metadata in a `uploads` table
protected by RLS. Guests see/delete only their own uploads. A local Python script with the
service key exports all originals per guest. A small Node script renders a printable QR card.

## Technical Context

**Language/Version**: TypeScript 5.9 (frontend), Python 3.12+ (export script, run via `uv`)
**Primary Dependencies**: Vue 3.5, Vite 8, Tailwind CSS 4 (`@tailwindcss/vite`),
`@supabase/supabase-js` 2.x, `tus-js-client` 4.x, `@fontsource/*` fonts, `qrcode` (card script)
**Storage**: Supabase Postgres (`public.uploads`) + Supabase Storage (private bucket `media`)
**Testing**: Vitest + happy-dom (unit), Node RLS integration script against a real project,
manual device checklist
**Target Platform**: iOS Safari 16+, Android Chrome (last 2 years); desktop browsers "ok"
**Project Type**: static web SPA + SQL migrations + CLI scripts
**Performance Goals**: first screen ≤ 3 s on 4G (JS+CSS gzip budget ≈ 150 KB excl. fonts);
2–3 parallel uploads per device
**Constraints**: no custom backend; originals untouched; resumable uploads with 6 MB TUS chunks
(Supabase requirement); private bucket + signed URLs (TTL 1 h for view, 10 min not needed)
**Scale/Scope**: ~27 guests, ≤ 40 GB, 1 peak day, 1 screen

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Simplest Thing That Works | ✅ | One view, no router, no state library, no backend |
| II. No Custom Backend — RLS | ✅ | `supabase/migrations/*.sql`; `scripts/rls-test.mjs` two-session test |
| III. Originals Are Sacred | ✅ | TUS upload of the raw `File`; thumbnail failure only logs + placeholder |
| IV. Mobile-First | ✅ | `accept="image/*,video/*" multiple`; per-file status + retry; Ukrainian copy |
| V. Secrets & Privacy | ✅ | `VITE_SUPABASE_URL/ANON_KEY` only in frontend; `.env` git-ignored; `noindex`; fonts self-hosted |
| VI. Config-Driven | ✅ | `src/config.ts` holds names/date/copy/limits |

Post-design re-check: ✅ no violations; Complexity Tracking empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-guest-media-upload/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── supabase-schema.md     # table, RLS, storage policies (contract with Supabase)
│   ├── storage-layout.md      # object path conventions
│   └── export-cli.md          # scripts/export.py interface
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
index.html                  # noindex meta, mount point
src/
├── main.ts
├── App.vue                 # the single view
├── config.ts               # names, date, copy, limits, palette
├── style.css               # Tailwind + theme tokens + fonts
├── lib/
│   ├── supabase.ts         # client + ensureSession()
│   ├── media.ts            # kind/ext detection, validation, object paths (pure)
│   ├── thumbnail.ts        # canvas thumbnails for image/video (browser)
│   ├── tusUpload.ts        # tus-js-client wrapper for Supabase resumable endpoint
│   ├── queue.ts            # concurrency-limited task queue (pure)
│   └── uploads.ts          # orchestration: thumb → TUS → thumb upload → insert; list; delete
├── components/
│   ├── Hero.vue            # names, date, olive branches
│   ├── NameField.vue
│   ├── UploadList.vue      # per-file progress/status/retry
│   ├── Gallery.vue         # "Ваші моменти" grid
│   └── Viewer.vue          # full-screen photo/video
└── assets/olive.svg
tests/unit/                 # vitest: media, queue
supabase/migrations/        # 0001_uploads.sql, 0002_storage.sql
scripts/
├── export.py               # uv script, service key from .env
├── rls-test.mjs            # two anonymous sessions isolation test
└── qr-card.mjs             # renders docs/qr-card.html (+ SVG QR)
docs/
├── after-wedding.md        # runbook
└── device-test-checklist.md
.github/workflows/deploy.yml
```

**Structure Decision**: single frontend project at repo root (Vite), SQL in `supabase/`, ops
scripts in `scripts/`. No backend directory by constitution principle II.

## Complexity Tracking

_None._

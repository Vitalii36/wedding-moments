<!--
Sync Impact Report
- Version change: (template) → 1.0.0
- Principles defined: I. Simplest Thing That Works; II. No Custom Backend — Security Lives in RLS;
  III. Originals Are Sacred; IV. Mobile-First, Guest-Friendly; V. Secrets & Privacy by Default;
  VI. Single-Tenant, Config-Driven
- Added sections: Technology Constraints; Development Workflow & Quality Gates; Governance
- Removed sections: none
- Templates: .specify/templates/plan-template.md ✅ (generic Constitution Check gate, no change needed)
  .specify/templates/spec-template.md ✅  .specify/templates/tasks-template.md ✅
- Deferred TODOs: none
-->

# wedding-moments Constitution

## Core Principles

### I. Simplest Thing That Works

The system MUST be the simplest design that serves ~27 guests with phones on one day.
No feature, abstraction, or dependency is added "for later" (YAGNI). Multi-tenancy,
payments, admin panels, comments, likes, server-side transcoding and face recognition
are out of scope for v1. Any added complexity MUST be justified in the plan's
Complexity Tracking table.

### II. No Custom Backend — Security Lives in RLS

The browser talks directly to Supabase (Auth, Storage, Postgres). There is no
application server. All access control MUST be expressed as Row Level Security and
Storage policies, versioned as SQL migrations in `supabase/migrations/`. Because security
rests entirely on RLS, an automated two-session RLS test (user A cannot read or delete
user B's rows/objects; no session → nothing) MUST exist and pass before the event.

### III. Originals Are Sacred

Uploaded photos and videos MUST be stored byte-for-byte as received: no compression,
resizing or transcoding. Thumbnails/posters are generated client-side and stored
alongside; failure to produce a thumbnail MUST NOT block or fail the original upload.
Uploads MUST be resumable (TUS) so large videos survive flaky venue Wi-Fi.

### IV. Mobile-First, Guest-Friendly

iOS Safari and Android Chrome are the primary targets. The page MUST open without login
and render in ≤ 3 s on 4G. UI language is Ukrainian, copy is warm and short. One failed
file MUST never break the rest of a batch; every failure is visible on the file itself
with a retry action.

### V. Secrets & Privacy by Default

Only the Supabase URL and anon key may ship in the frontend. The service-role key lives
only in a local, git-ignored `.env` used by `scripts/`. The storage bucket is private;
media is viewed via short-TTL signed URLs. The site is `noindex`. No third-party CDNs at
runtime: fonts and assets are self-hosted.

### VI. Single-Tenant, Config-Driven

Names, date, copy and palette come from one file, `src/config.ts`. The code is not
generalised for resale until a real buyer exists; the config file is the only seam.

## Technology Constraints

- Frontend: Vue 3 + Vite + TypeScript + Tailwind CSS, single view, no router.
- Uploads: `tus-js-client` against Supabase Storage resumable endpoint.
- Backend: Supabase (anonymous auth, private bucket `media`, table `uploads`).
- Hosting: static build on GitHub Pages via GitHub Actions.
- Export: `scripts/export.py` (Python, service key from `.env`).

## Development Workflow & Quality Gates

- Spec-driven: constitution → spec → plan → tasks → implement (GitHub Spec Kit).
- Every change MUST pass `npm run typecheck`, `npm run test` and `npm run build`.
- Pure logic (queue, paths, validation, thumbnail sizing) MUST have unit tests (Vitest).
- RLS test script MUST be run against the real project before the event.
- Manual device checklist (iPhone Safari, Android Chrome, old device, Wi-Fi drop
  mid-upload, HEIC, portrait video) MUST be completed before printing the QR codes.

## Governance

This constitution supersedes other practices for this repository. Amendments are made by
editing this file with a Sync Impact Report and a semantic version bump (MAJOR: principle
removed/redefined; MINOR: principle/section added; PATCH: wording). Plans MUST include a
Constitution Check; violations require an entry in Complexity Tracking. `PLAN.md` holds the
original product plan and ADRs and is the source of truth for intent.

**Version**: 1.0.0 | **Ratified**: 2026-11-19 | **Last Amended**: 2026-11-19

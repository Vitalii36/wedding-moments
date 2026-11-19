# wedding-moments

Guest photo & video sharing for a wedding: scan QR → upload → see your moments.
Vue + Supabase, no custom backend.

- **Product plan & ADRs**: [`PLAN.md`](PLAN.md)
- **Principles**: [`.specify/memory/constitution.md`](.specify/memory/constitution.md)
- **Spec / plan / tasks** (GitHub Spec Kit): [`specs/001-guest-media-upload/`](specs/001-guest-media-upload/)
- **Setup**: [`quickstart.md`](specs/001-guest-media-upload/quickstart.md)
- **Before/after the wedding**: [`docs/after-wedding.md`](docs/after-wedding.md)

## How it works

Guests sign in anonymously, upload originals straight to a private Supabase Storage bucket over
TUS (resumable), and a client-made thumbnail goes next to each file. A row in `uploads` records
the metadata; Row Level Security makes sure every guest only sees and deletes their own files.

## Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | local dev server |
| `npm run test` | unit tests (Vitest) |
| `npm run typecheck` | `vue-tsc` |
| `npm run build` | production build into `dist/` |
| `npm run rls-test` | two-session RLS isolation test against the real project (`.env`) |
| `npm run qr-card -- <url>` | printable QR cards → `docs/qr-card.html` |
| `uv run scripts/export.py` | download all originals into `export/<guest>/` (service key) |

## Customising

Names, date, copy and limits: [`src/config.ts`](src/config.ts). Palette: `@theme` in
[`src/style.css`](src/style.css). Olive branch artwork: [`src/assets/olive.svg`](src/assets/olive.svg)
(placeholder — replace with the invitation art).

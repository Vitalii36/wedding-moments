# Device & network test checklist (PLAN §6, tests 2–6)

Run against the deployed site with the real Supabase project.

| # | Test | iPhone Safari | Android Chrome | Old device |
|---|------|:---:|:---:|:---:|
| 1 | QR scan opens the site < 3 s on 4G, no login | ☐ | ☐ | ☐ |
| 2 | Select 10 photos + 1 video at once; every file shows progress and "Готово" | ☐ | ☐ | ☐ |
| 3 | HEIC photo: uploads, thumbnail shows correct orientation (or placeholder) | ☐ | — | ☐ |
| 4 | Portrait video: poster thumbnail is portrait | ☐ | ☐ | ☐ |
| 5 | Wi-Fi off mid-way through a 300 MB+ video → back on → continues (percent does not reset to 0) | ☐ | ☐ | — |
| 6 | Close tab mid-upload, reopen, select same video → resumes | ☐ | ☐ | — |
| 7 | Reload → "Ваші моменти" shows the same items; open photo + play video | ☐ | ☐ | ☐ |
| 8 | Delete one item → gone after reload | ☐ | ☐ | ☐ |
| 9 | Name entered → persists after reload; appears in export folder name | ☐ | ☐ | ☐ |
| 10 | A PDF / other file is rejected with a message, others continue | ☐ | ☐ | ☐ |

## Load test (test 4)
8–10 people at once, each 20 photos + 1 video. Pass: all reach "Готово", no lost files
(compare counts in Table editor vs. what each person selected).

## Export test (test 5)
`uv run scripts/export.py` → `failed=0`, `on_disk == records`; spot-check a few files open and
are byte-identical (same size as on the phone).

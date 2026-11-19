# Contract: Storage object layout

- Original: `media/{owner_uuid}/{upload_id}.{ext}` — `ext` lowercased from filename, else from MIME
  (`jpg`, `png`, `heic`, `mp4`, `mov`, …), else `bin`.
- Thumbnail: `media/{owner_uuid}/{upload_id}_t.jpg` (JPEG, longest side 480 px).
- Objects are never overwritten (`x-upsert: false`).
- Export target: `export/{safe_guest_name or owner_uuid[:8]}/{YYYYmmdd-HHMMSS}_{upload_id[:8]}.{ext}`.

# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx>=0.27", "python-dotenv>=1.0"]
# ///
"""Download every original from Supabase into export/<guest>/ (contracts/export-cli.md).

Usage:  uv run scripts/export.py [--out export] [--dry-run]
Needs SUPABASE_URL and SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) in .env (never commit it).
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from datetime import datetime
from pathlib import Path

import httpx
from dotenv import load_dotenv

BUCKET = "media"
PAGE = 1000


def safe_folder(name: str | None, owner: str) -> str:
    if name:
        cleaned = re.sub(r"[^\w\- .']+", "", name, flags=re.UNICODE).strip(" .")
        if cleaned:
            return f"{cleaned[:60]} ({owner[:4]})"
    return f"guest-{owner[:8]}"


def target_for(row: dict, out: Path) -> Path:
    created = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
    ext = row["path"].rsplit(".", 1)[-1] if "." in row["path"] else "bin"
    fname = f"{created:%Y%m%d-%H%M%S}_{row['id'][:8]}.{ext}"
    return out / safe_folder(row.get("guest_name"), row["owner"]) / fname


def fetch_rows(client: httpx.Client) -> list[dict]:
    rows: list[dict] = []
    offset = 0
    while True:
        r = client.get(
            "/rest/v1/uploads",
            params={"select": "*", "order": "created_at.asc,id.asc"},
            headers={"Range-Unit": "items", "Range": f"{offset}-{offset + PAGE - 1}"},
        )
        r.raise_for_status()
        batch = r.json()
        rows.extend(batch)
        if len(batch) < PAGE:
            return rows
        offset += PAGE


def download(client: httpx.Client, row: dict, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".part")
    with client.stream("GET", f"/storage/v1/object/{BUCKET}/{row['path']}") as r:
        r.raise_for_status()
        with tmp.open("wb") as f:
            for chunk in r.iter_bytes(1024 * 1024):
                f.write(chunk)
    if tmp.stat().st_size != int(row["size_bytes"]):
        tmp.unlink(missing_ok=True)
        raise RuntimeError(f"size mismatch for {row['path']}")
    tmp.replace(dest)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="export", type=Path)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    load_dotenv()
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SECRET_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("SUPABASE_URL and SUPABASE_SECRET_KEY (sb_secret_...) must be set in .env", file=sys.stderr)
        return 2

    headers = {"apikey": key}
    if key.startswith("eyJ"):  # legacy JWT service_role key also needs Bearer
        headers["Authorization"] = f"Bearer {key}"
    with httpx.Client(base_url=url.rstrip("/"), headers=headers, timeout=httpx.Timeout(30, read=600)) as client:
        rows = fetch_rows(client)
        downloaded = skipped = failed = 0
        for i, row in enumerate(rows, 1):
            dest = target_for(row, args.out)
            if dest.exists() and dest.stat().st_size == int(row["size_bytes"]):
                skipped += 1
                continue
            print(f"[{i}/{len(rows)}] {row['path']} -> {dest}")
            if args.dry_run:
                continue
            try:
                download(client, row, dest)
                downloaded += 1
            except Exception as e:  # keep going; report at the end
                failed += 1
                print(f"  FAILED: {e}", file=sys.stderr)

    on_disk = sum(1 for row in rows if target_for(row, args.out).exists())
    print(f"records={len(rows)} downloaded={downloaded} skipped={skipped} failed={failed} on_disk={on_disk}")
    if args.dry_run:
        return 0
    return 0 if failed == 0 and on_disk == len(rows) else 1


if __name__ == "__main__":
    sys.exit(main())

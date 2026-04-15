"""Google Drive public link resolver and downloader (no OAuth, public/shared links only)."""

import logging
import re
import tempfile
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)


def _extract_folder_id(url: str) -> str | None:
    m = re.search(r"/folders/([a-zA-Z0-9_-]+)", url)
    return m.group(1) if m else None


def _extract_file_id(url: str) -> str | None:
    m = re.search(r"/d/([a-zA-Z0-9_-]+)", url)
    if m:
        return m.group(1)
    m = re.search(r"id=([a-zA-Z0-9_-]+)", url)
    return m.group(1) if m else None


async def list_gdrive_files(url: str) -> list[dict]:
    """Return list of {name, url} for files in a public GDrive folder or single file."""
    file_id = _extract_file_id(url)
    folder_id = _extract_folder_id(url)

    if folder_id:
        return await _list_folder(folder_id)
    if file_id:
        return [{"name": f"gdrive_{file_id}", "url": _download_url(file_id)}]
    return []


async def _list_folder(folder_id: str) -> list[dict]:
    page_url = f"https://drive.google.com/drive/folders/{folder_id}"
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        resp = await client.get(page_url)
        text = resp.text

    results: list[dict] = []
    for m in re.finditer(r'/d/([a-zA-Z0-9_-]{10,})', text):
        fid = m.group(1)
        if fid not in {r.get("_id") for r in results}:
            results.append({"name": f"gdrive_{fid}", "url": _download_url(fid), "_id": fid})

    return [{"name": r["name"], "url": r["url"]} for r in results]


def _download_url(file_id: str) -> str:
    return f"https://drive.google.com/uc?export=download&id={file_id}"


async def download_gdrive_file(url: str, dest_dir: str | None = None) -> str:
    dest = Path(dest_dir) if dest_dir else Path(tempfile.gettempdir())
    dest.mkdir(parents=True, exist_ok=True)

    async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        cd = resp.headers.get("content-disposition", "")
        m = re.search(r'filename="?([^";\n]+)"?', cd)
        fname = m.group(1) if m else "gdrive_file"
        fpath = dest / fname
        fpath.write_bytes(resp.content)

    return str(fpath)

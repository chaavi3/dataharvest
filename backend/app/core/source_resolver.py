"""Resolve a SourceConfig into a list of concrete SourceItems."""

import logging
import re
import uuid
from urllib.parse import urljoin

from ..models.source import SourceConfig, SourceItem, SourceType

logger = logging.getLogger(__name__)


async def resolve_sources(
    config: SourceConfig,
    fetcher_fn=None,
) -> list[SourceItem]:
    st = config.source_type

    if st == SourceType.SINGLE_URL:
        url = config.urls[0] if config.urls else config.hub_url or ""
        return [SourceItem(id=_uid(), url=url, label=url)]

    if st == SourceType.URL_LIST:
        return [SourceItem(id=_uid(), url=u.strip(), label=u.strip()) for u in config.urls if u.strip()]

    if st == SourceType.WEBPAGE_WITH_LINKS:
        return await _resolve_hub(config, fetcher_fn)

    if st == SourceType.SEARCH_KEYWORDS:
        return await _resolve_search(config)

    if st in (SourceType.SINGLE_DOCUMENT, SourceType.BULK_DOCUMENTS):
        return [
            SourceItem(id=_uid(), file_path=fp, label=fp.split("/")[-1].split("\\")[-1])
            for fp in config.uploaded_files
        ]

    if st == SourceType.GDRIVE_LINK:
        return await _resolve_gdrive(config)

    if st == SourceType.PROMPT_GUIDED:
        url = config.urls[0] if config.urls else config.hub_url or ""
        return [SourceItem(id=_uid(), url=url, label=f"Guided: {url}")]

    return []


async def _resolve_hub(config: SourceConfig, fetcher_fn=None) -> list[SourceItem]:
    """Load the hub page with Playwright and extract links."""
    if fetcher_fn is None:
        from .fetcher import fetch_page_content
        fetcher_fn = fetch_page_content

    hub_url = config.hub_url or (config.urls[0] if config.urls else "")
    if not hub_url:
        return []

    content, links = await fetcher_fn(hub_url, extract_links=True)

    filtered: list[str] = []
    for href in links:
        full = urljoin(hub_url, href)
        if config.link_pattern:
            if re.search(config.link_pattern, full):
                filtered.append(full)
        elif config.link_selector:
            filtered.append(full)
        else:
            filtered.append(full)

    seen: set[str] = set()
    items: list[SourceItem] = []
    for url in filtered:
        if url not in seen:
            seen.add(url)
            items.append(SourceItem(id=_uid(), url=url, label=url))
    return items


async def _resolve_search(config: SourceConfig) -> list[SourceItem]:
    from .search import search_serpapi

    if not config.keywords:
        return []
    urls = await search_serpapi(config.keywords, count=config.search_result_count)
    return [SourceItem(id=_uid(), url=u, label=u) for u in urls]


async def _resolve_gdrive(config: SourceConfig) -> list[SourceItem]:
    from .gdrive import list_gdrive_files

    url = config.gdrive_url or ""
    if not url:
        return []
    files = await list_gdrive_files(url)
    return [SourceItem(id=_uid(), url=f["url"], label=f["name"]) for f in files]


def _uid() -> str:
    return uuid.uuid4().hex[:12]

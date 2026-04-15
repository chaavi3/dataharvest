"""SerpAPI integration for keyword-based source discovery."""

import logging

import httpx

from ..state.config import get_settings

logger = logging.getLogger(__name__)

SERPAPI_URL = "https://serpapi.com/search.json"


async def search_serpapi(query: str, count: int = 10) -> list[str]:
    settings = get_settings()
    api_key = settings.serpapi_key
    if not api_key:
        logger.warning("SerpAPI key not configured; returning empty results")
        return []

    params = {
        "q": query,
        "api_key": api_key,
        "num": min(count, 100),
        "engine": "google",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(SERPAPI_URL, params=params)
        resp.raise_for_status()
        data = resp.json()

    urls: list[str] = []
    for result in data.get("organic_results", []):
        link = result.get("link")
        if link:
            urls.append(link)
        if len(urls) >= count:
            break
    return urls

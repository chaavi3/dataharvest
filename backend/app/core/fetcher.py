"""Fetch and clean web page content using Playwright."""

import asyncio
import logging
import re

from ..state.config import get_settings

logger = logging.getLogger(__name__)

_browser = None
_playwright = None


async def _get_browser():
    global _browser, _playwright
    if _browser and _browser.is_connected():
        return _browser

    from playwright.async_api import async_playwright

    settings = get_settings()
    _playwright = await async_playwright().start()
    _browser = await _playwright.chromium.launch(
        headless=settings.browser.headless,
        args=[
            "--disable-blink-features=AutomationControlled",
            "--no-first-run",
            "--no-default-browser-check",
        ],
    )
    return _browser


async def get_page():
    browser = await _get_browser()
    settings = get_settings()
    context = await browser.new_context(
        user_agent=settings.browser.user_agent,
        viewport={"width": 1920, "height": 1080},
        extra_http_headers={
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
        },
    )
    await context.add_init_script(
        "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"
    )
    page = await context.new_page()
    return page


async def fetch_page_content(
    url: str,
    extract_links: bool = False,
    wait_ms: int = 3000,
) -> tuple[str, list[str]]:
    """Return (cleaned_text, links). Links list is populated only when extract_links=True."""
    page = await get_page()
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(wait_ms)

        links: list[str] = []
        if extract_links:
            links = await page.evaluate("""() => {
                return Array.from(document.querySelectorAll('a[href]'))
                    .map(a => a.getAttribute('href'))
                    .filter(h => h && !h.startsWith('javascript:') && !h.startsWith('#'));
            }""")

        raw_html = await page.content()
        text = _clean_html(raw_html)
        return text, links
    except Exception as exc:
        logger.error("Failed to fetch %s: %s", url, exc)
        return "", []
    finally:
        try:
            await page.context.close()
        except Exception:
            pass


async def close_browser():
    global _browser, _playwright
    if _browser:
        try:
            await _browser.close()
        except Exception:
            pass
        _browser = None
    if _playwright:
        try:
            await _playwright.stop()
        except Exception:
            pass
        _playwright = None


def _clean_html(html: str) -> str:
    text = re.sub(r"<script[^>]*>.*?</script>", "", html, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

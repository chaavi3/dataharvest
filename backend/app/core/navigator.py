"""Playwright + LLM-guided navigation for prompt-guided source type."""

import logging

from ..llm.base import LLMProvider
from .fetcher import get_page

logger = logging.getLogger(__name__)

NAV_SYSTEM = """You are a web navigation assistant. You receive a snapshot of a web page's visible text and link list, plus the user's navigation instructions.

Decide the SINGLE next action to take. Respond with JSON only:
- {"action": "click", "link_text": "..."} to click a link by its text
- {"action": "done"} if the current page already contains the target data

Do NOT explain. Return ONLY the JSON object."""


async def navigate_and_fetch(
    url: str,
    instructions: str,
    provider: LLMProvider,
    max_steps: int = 5,
) -> str:
    """Follow user instructions to navigate to the right page, then return its text content."""
    import json
    import re

    page = await get_page()
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=30000)
        await page.wait_for_timeout(2000)

        for step in range(max_steps):
            text_content = await page.evaluate("""() => document.body.innerText.substring(0, 8000)""")
            links = await page.evaluate("""() =>
                Array.from(document.querySelectorAll('a')).slice(0, 100)
                    .map(a => ({text: a.innerText.trim(), href: a.href}))
                    .filter(l => l.text)
            """)

            link_list = "\n".join(f"- {l['text']}" for l in links[:60])
            snapshot = f"Page text (truncated):\n{text_content[:4000]}\n\nLinks:\n{link_list}"

            response = await provider.chat([
                {"role": "system", "content": NAV_SYSTEM},
                {"role": "user", "content": f"Instructions: {instructions}\n\nCurrent page: {page.url}\n\n{snapshot}"},
            ])

            try:
                clean = response.strip()
                if clean.startswith("```"):
                    clean = "\n".join(clean.split("\n")[1:])
                    if clean.endswith("```"):
                        clean = clean[:-3]
                action = json.loads(clean)
            except json.JSONDecodeError:
                logger.warning("Navigator got non-JSON response: %s", response[:200])
                break

            if action.get("action") == "done":
                break

            if action.get("action") == "click":
                target_text = action.get("link_text", "")
                try:
                    await page.get_by_text(target_text, exact=False).first.click()
                    await page.wait_for_timeout(3000)
                except Exception as exc:
                    logger.warning("Failed to click '%s': %s", target_text, exc)
                    break

        raw_html = await page.content()
        text = re.sub(r"<script[^>]*>.*?</script>", "", raw_html, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<style[^>]*>.*?</style>", "", text, flags=re.DOTALL | re.IGNORECASE)
        text = re.sub(r"<[^>]+>", " ", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text
    except Exception as exc:
        logger.error("Navigation failed for %s: %s", url, exc)
        return ""
    finally:
        try:
            await page.context.close()
        except Exception:
            pass

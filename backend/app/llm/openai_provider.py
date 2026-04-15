import json
import logging
from typing import Any

import openai

from .base import LLMProvider

logger = logging.getLogger(__name__)

EXTRACT_SYSTEM = """You are a data extraction assistant. You will receive raw page content or document text and a list of column definitions. Extract all matching rows from the content and return them as a JSON array of objects.

Rules:
- Each object's keys must exactly match the column names provided.
- If a value cannot be found for a column, use null.
- Return ONLY the JSON array — no explanation, no markdown fences."""

SUGGEST_SYSTEM = """You are a data analysis assistant. Given sample content, propose columns that would best capture the structured data present. Return a JSON array of objects with keys: "name", "description", "column_type" (one of text/number/date/url/boolean). Return ONLY the JSON array."""


class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "gpt-4o-mini", base_url: str | None = None):
        kwargs: dict[str, Any] = {"api_key": api_key}
        if base_url:
            kwargs["base_url"] = base_url
        self.client = openai.AsyncOpenAI(**kwargs)
        self.model = model

    async def extract_structured(
        self,
        content: str,
        columns: list[dict],
        system_prompt: str | None = None,
    ) -> list[dict]:
        col_desc = "\n".join(
            f'- {c["name"]}: {c.get("description", "")} (type: {c.get("column_type", "text")})'
            for c in columns
        )
        user_msg = f"Columns to extract:\n{col_desc}\n\nContent:\n{content[:60000]}"

        resp = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt or EXTRACT_SYSTEM},
                {"role": "user", "content": user_msg},
            ],
            temperature=0,
            response_format={"type": "json_object"},
        )
        raw = resp.choices[0].message.content or "[]"
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                for v in parsed.values():
                    if isinstance(v, list):
                        return v
                return [parsed]
        except json.JSONDecodeError:
            logger.error("LLM returned non-JSON: %s", raw[:200])
            return []

    async def suggest_schema(self, content: str) -> list[dict]:
        resp = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": SUGGEST_SYSTEM},
                {"role": "user", "content": f"Sample content:\n{content[:30000]}"},
            ],
            temperature=0,
            response_format={"type": "json_object"},
        )
        raw = resp.choices[0].message.content or "[]"
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return parsed
            if isinstance(parsed, dict):
                for v in parsed.values():
                    if isinstance(v, list):
                        return v
            return []
        except json.JSONDecodeError:
            return []

    async def chat(self, messages: list[dict]) -> str:
        resp = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0,
        )
        return resp.choices[0].message.content or ""

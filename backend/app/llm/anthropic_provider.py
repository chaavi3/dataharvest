import json
import logging

from .base import LLMProvider

logger = logging.getLogger(__name__)

EXTRACT_SYSTEM = """You are a data extraction assistant. You will receive raw page content or document text and a list of column definitions. Extract all matching rows from the content and return them as a JSON array of objects.

Rules:
- Each object's keys must exactly match the column names provided.
- If a value cannot be found for a column, use null.
- Return ONLY the JSON array — no explanation, no markdown fences."""

SUGGEST_SYSTEM = """You are a data analysis assistant. Given sample content, propose columns that would best capture the structured data present. Return a JSON array of objects with keys: "name", "description", "column_type" (one of text/number/date/url/boolean). Return ONLY the JSON array."""


def _parse_json_response(raw: str) -> list[dict]:
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        text = "\n".join(lines)
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            return parsed
        if isinstance(parsed, dict):
            for v in parsed.values():
                if isinstance(v, list):
                    return v
            return [parsed]
    except json.JSONDecodeError:
        logger.error("Anthropic LLM returned non-JSON: %s", text[:200])
    return []


class AnthropicProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        import anthropic
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
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
        resp = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system_prompt or EXTRACT_SYSTEM,
            messages=[{"role": "user", "content": user_msg}],
        )
        raw = resp.content[0].text if resp.content else "[]"
        return _parse_json_response(raw)

    async def suggest_schema(self, content: str) -> list[dict]:
        resp = await self.client.messages.create(
            model=self.model,
            max_tokens=2048,
            system=SUGGEST_SYSTEM,
            messages=[{"role": "user", "content": f"Sample content:\n{content[:30000]}"}],
        )
        raw = resp.content[0].text if resp.content else "[]"
        return _parse_json_response(raw)

    async def chat(self, messages: list[dict]) -> str:
        system = ""
        chat_msgs = []
        for m in messages:
            if m["role"] == "system":
                system = m["content"]
            else:
                chat_msgs.append(m)
        kwargs = {"model": self.model, "max_tokens": 4096, "messages": chat_msgs}
        if system:
            kwargs["system"] = system
        resp = await self.client.messages.create(**kwargs)
        return resp.content[0].text if resp.content else ""

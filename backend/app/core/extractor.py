"""LLM-based data extraction: send content + schema, get structured rows."""

import logging

from ..llm.base import LLMProvider
from ..models.schema import ColumnDef

logger = logging.getLogger(__name__)


async def extract_rows(
    provider: LLMProvider,
    content: str,
    columns: list[ColumnDef],
) -> list[dict]:
    col_dicts = [c.model_dump() for c in columns]
    try:
        rows = await provider.extract_structured(content, col_dicts)
        col_names = {c.name for c in columns}
        cleaned = []
        for row in rows:
            cleaned.append({k: v for k, v in row.items() if k in col_names})
        return cleaned
    except Exception as exc:
        logger.error("Extraction failed: %s", exc)
        return []


async def suggest_columns(provider: LLMProvider, content: str) -> list[dict]:
    try:
        return await provider.suggest_schema(content)
    except Exception as exc:
        logger.error("Schema suggestion failed: %s", exc)
        return []

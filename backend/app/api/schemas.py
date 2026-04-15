"""Schema template CRUD endpoints."""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..models.schema import ColumnDef, SchemaTemplate

router = APIRouter(prefix="/api/templates", tags=["templates"])

_TEMPLATES_FILE = Path(__file__).resolve().parents[3] / "schema_templates.json"


def _load_templates() -> list[SchemaTemplate]:
    if not _TEMPLATES_FILE.exists():
        return []
    raw = json.loads(_TEMPLATES_FILE.read_text(encoding="utf-8"))
    return [SchemaTemplate(**t) for t in raw]


def _save_templates(templates: list[SchemaTemplate]):
    _TEMPLATES_FILE.write_text(
        json.dumps([t.model_dump() for t in templates], indent=2),
        encoding="utf-8",
    )


class TemplateCreate(BaseModel):
    name: str
    description: str = ""
    columns: list[ColumnDef]


@router.get("", response_model=list[SchemaTemplate])
async def list_templates():
    return _load_templates()


@router.post("", response_model=SchemaTemplate)
async def create_template(data: TemplateCreate):
    now = datetime.now(timezone.utc).isoformat()
    t = SchemaTemplate(
        id=uuid.uuid4().hex[:12],
        name=data.name,
        description=data.description,
        columns=data.columns,
        created_at=now,
        updated_at=now,
    )
    templates = _load_templates()
    templates.append(t)
    _save_templates(templates)
    return t


@router.get("/{template_id}", response_model=SchemaTemplate)
async def get_template(template_id: str):
    for t in _load_templates():
        if t.id == template_id:
            return t
    raise HTTPException(404, "Template not found")


@router.delete("/{template_id}")
async def delete_template(template_id: str):
    templates = _load_templates()
    new = [t for t in templates if t.id != template_id]
    if len(new) == len(templates):
        raise HTTPException(404, "Template not found")
    _save_templates(new)
    return {"ok": True}

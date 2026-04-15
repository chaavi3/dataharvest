from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class ColumnType(str, Enum):
    TEXT = "text"
    NUMBER = "number"
    DATE = "date"
    URL = "url"
    BOOLEAN = "boolean"


class ColumnDef(BaseModel):
    name: str
    description: str
    column_type: ColumnType = ColumnType.TEXT
    required: bool = False


class SchemaTemplate(BaseModel):
    id: str
    name: str
    description: str = ""
    columns: list[ColumnDef] = Field(default_factory=list)
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

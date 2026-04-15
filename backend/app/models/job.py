from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from .schema import ColumnDef
from .source import SourceConfig, SourceItem


class JobStatus(str, Enum):
    CREATED = "created"
    RESOLVING = "resolving"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class JobConfig(BaseModel):
    llm_provider: str = "openai"
    llm_model: str = "gpt-4o-mini"
    concurrency: int = 1
    rate_limit_rpm: int = 30
    retry_max: int = 3


class Job(BaseModel):
    id: str
    name: str
    status: JobStatus = JobStatus.CREATED
    source_config: SourceConfig
    columns: list[ColumnDef] = Field(default_factory=list)
    config: JobConfig = Field(default_factory=JobConfig)
    sources: list[SourceItem] = Field(default_factory=list)
    created_at: str = ""
    updated_at: str = ""
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    total_rows: int = 0
    error: Optional[str] = None


class JobCreate(BaseModel):
    name: str
    source_config: SourceConfig
    columns: list[ColumnDef] = Field(default_factory=list)
    config: JobConfig = Field(default_factory=JobConfig)


class JobSummary(BaseModel):
    id: str
    name: str
    status: JobStatus
    source_type: str
    total_sources: int
    completed_sources: int
    failed_sources: int
    total_rows: int
    created_at: str
    updated_at: str

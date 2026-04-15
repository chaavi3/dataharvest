from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class SourceType(str, Enum):
    SINGLE_URL = "single_url"
    URL_LIST = "url_list"
    WEBPAGE_WITH_LINKS = "webpage_with_links"
    SEARCH_KEYWORDS = "search_keywords"
    SINGLE_DOCUMENT = "single_document"
    BULK_DOCUMENTS = "bulk_documents"
    GDRIVE_LINK = "gdrive_link"
    PROMPT_GUIDED = "prompt_guided"


class SourceConfig(BaseModel):
    source_type: SourceType
    urls: list[str] = Field(default_factory=list)
    keywords: Optional[str] = None
    search_result_count: int = 10
    hub_url: Optional[str] = None
    link_selector: Optional[str] = None
    link_pattern: Optional[str] = None
    gdrive_url: Optional[str] = None
    navigation_prompt: Optional[str] = None
    uploaded_files: list[str] = Field(default_factory=list)


class SourceItemStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class SourceItem(BaseModel):
    id: str
    url: Optional[str] = None
    file_path: Optional[str] = None
    label: str = ""
    status: SourceItemStatus = SourceItemStatus.PENDING
    error: Optional[str] = None
    retry_count: int = 0
    extracted_rows: list[dict] = Field(default_factory=list)

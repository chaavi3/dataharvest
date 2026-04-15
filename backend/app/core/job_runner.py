"""Job orchestration: resolve sources, iterate, extract, persist state."""

import asyncio
import logging
from datetime import datetime, timezone

from ..llm.registry import get_provider
from ..models.job import Job, JobStatus
from ..models.source import SourceItemStatus, SourceType
from ..state.config import get_settings
from ..state.job_state import save_job
from .document_parser import parse_document
from .extractor import extract_rows
from .fetcher import fetch_page_content
from .merger import filter_required, merge_rows
from .navigator import navigate_and_fetch
from .source_resolver import resolve_sources

logger = logging.getLogger(__name__)

_running_jobs: dict[str, bool] = {}


def is_job_running(job_id: str) -> bool:
    return _running_jobs.get(job_id, False)


def cancel_job(job_id: str):
    _running_jobs[job_id] = False


async def run_job(job: Job) -> Job:
    job_id = job.id
    _running_jobs[job_id] = True

    try:
        if job.status in (JobStatus.CREATED, JobStatus.PAUSED):
            if not job.sources:
                job.status = JobStatus.RESOLVING
                job.started_at = _now()
                save_job(job)

                sources = await resolve_sources(job.source_config)
                job.sources = sources
                save_job(job)

            job.status = JobStatus.RUNNING
            job.updated_at = _now()
            save_job(job)

        settings = get_settings()
        provider = get_provider(settings, job.config.llm_provider, job.config.llm_model)

        pending = [
            s for s in job.sources
            if s.status in (SourceItemStatus.PENDING, SourceItemStatus.IN_PROGRESS)
        ]

        for source in pending:
            if not _running_jobs.get(job_id, False):
                job.status = JobStatus.PAUSED
                job.updated_at = _now()
                save_job(job)
                return job

            source.status = SourceItemStatus.IN_PROGRESS
            save_job(job)

            try:
                if source.file_path:
                    content = await parse_document(source.file_path)
                elif source.url and job.source_config.source_type == SourceType.PROMPT_GUIDED:
                    content = await navigate_and_fetch(
                        source.url,
                        job.source_config.navigation_prompt or "",
                        provider,
                    )
                elif source.url:
                    content, _ = await fetch_page_content(source.url)
                else:
                    content = ""

                if content and job.columns:
                    rows = await extract_rows(provider, content, job.columns)
                    source.extracted_rows = rows
                    job.total_rows = sum(len(s.extracted_rows) for s in job.sources)

                source.status = SourceItemStatus.COMPLETED
            except Exception as exc:
                source.retry_count += 1
                if source.retry_count >= job.config.retry_max:
                    source.status = SourceItemStatus.FAILED
                    source.error = str(exc)
                else:
                    source.status = SourceItemStatus.PENDING
                    source.error = str(exc)
                logger.error("Source %s failed: %s", source.label, exc)

            job.updated_at = _now()
            save_job(job)

            await asyncio.sleep(60.0 / max(job.config.rate_limit_rpm, 1))

        all_done = all(
            s.status in (SourceItemStatus.COMPLETED, SourceItemStatus.FAILED)
            for s in job.sources
        )
        if all_done:
            all_rows = [s.extracted_rows for s in job.sources if s.extracted_rows]
            merged = merge_rows(all_rows, job.columns)
            merged = filter_required(merged, job.columns)
            job.total_rows = len(merged)
            job.status = JobStatus.COMPLETED
            job.completed_at = _now()
        else:
            job.status = JobStatus.PAUSED

        job.updated_at = _now()
        save_job(job)
        return job

    except Exception as exc:
        job.status = JobStatus.FAILED
        job.error = str(exc)
        job.updated_at = _now()
        save_job(job)
        logger.error("Job %s failed: %s", job_id, exc)
        return job
    finally:
        _running_jobs.pop(job_id, None)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

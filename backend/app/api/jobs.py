"""Job CRUD, control (pause/resume/cancel), and status endpoints."""

import asyncio
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, HTTPException

from ..core.exporter import export_csv
from ..core.extractor import suggest_columns
from ..core.fetcher import fetch_page_content
from ..core.job_runner import cancel_job, is_job_running, run_job
from ..core.source_resolver import resolve_sources
from ..llm.registry import get_provider
from ..models.job import Job, JobConfig, JobCreate, JobStatus, JobSummary
from ..models.schema import ColumnDef
from ..models.source import SourceItemStatus
from ..state.config import get_settings
from ..state.job_state import delete_job_file, list_jobs, load_job, save_job

router = APIRouter(prefix="/api/jobs", tags=["jobs"])


@router.get("", response_model=list[JobSummary])
async def list_all_jobs():
    jobs = list_jobs()
    return [_summarize(j) for j in jobs]


@router.post("", response_model=dict)
async def create_job(data: JobCreate):
    now = datetime.now(timezone.utc).isoformat()
    job = Job(
        id=uuid.uuid4().hex[:12],
        name=data.name,
        source_config=data.source_config,
        columns=data.columns,
        config=data.config or JobConfig(),
        created_at=now,
        updated_at=now,
    )
    save_job(job)
    return {"id": job.id, "status": job.status}


@router.get("/{job_id}")
async def get_job(job_id: str):
    job = load_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job.model_dump()


@router.delete("/{job_id}")
async def delete_job(job_id: str):
    if is_job_running(job_id):
        cancel_job(job_id)
    if not delete_job_file(job_id):
        raise HTTPException(404, "Job not found")
    return {"ok": True}


@router.post("/{job_id}/run")
async def start_job(job_id: str, background_tasks: BackgroundTasks):
    job = load_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if is_job_running(job_id):
        raise HTTPException(409, "Job is already running")

    background_tasks.add_task(_run_wrapper, job)
    return {"status": "started"}


@router.post("/{job_id}/pause")
async def pause_job(job_id: str):
    if not is_job_running(job_id):
        raise HTTPException(409, "Job is not running")
    cancel_job(job_id)
    return {"status": "pausing"}


@router.post("/{job_id}/resume")
async def resume_job(job_id: str, background_tasks: BackgroundTasks):
    job = load_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    if is_job_running(job_id):
        raise HTTPException(409, "Job is already running")

    for s in job.sources:
        if s.status == SourceItemStatus.IN_PROGRESS:
            s.status = SourceItemStatus.PENDING
    save_job(job)

    background_tasks.add_task(_run_wrapper, job)
    return {"status": "resumed"}


@router.post("/{job_id}/retry-failed")
async def retry_failed(job_id: str, background_tasks: BackgroundTasks):
    job = load_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    for s in job.sources:
        if s.status == SourceItemStatus.FAILED:
            s.status = SourceItemStatus.PENDING
            s.retry_count = 0
            s.error = None
    job.status = JobStatus.PAUSED
    save_job(job)
    background_tasks.add_task(_run_wrapper, job)
    return {"status": "retrying"}


@router.post("/{job_id}/resolve-sources")
async def resolve_job_sources(job_id: str):
    job = load_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    sources = await resolve_sources(job.source_config)
    job.sources = sources
    job.updated_at = datetime.now(timezone.utc).isoformat()
    save_job(job)
    return {"count": len(sources), "sources": [s.model_dump() for s in sources]}


@router.post("/suggest-schema")
async def suggest_schema_endpoint(data: dict):
    url = data.get("url", "")
    content = data.get("content", "")
    if url and not content:
        content, _ = await fetch_page_content(url)
    if not content:
        raise HTTPException(400, "No content to analyse")

    settings = get_settings()
    provider = get_provider(settings)
    columns = await suggest_columns(provider, content)
    return {"columns": columns}


@router.get("/{job_id}/data")
async def get_job_data(job_id: str):
    job = load_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    all_rows: list[dict] = []
    for s in job.sources:
        all_rows.extend(s.extracted_rows)
    return {"rows": all_rows, "total": len(all_rows)}


async def _run_wrapper(job: Job):
    try:
        await run_job(job)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).error("Job run failed: %s", exc)


def _summarize(job: Job) -> JobSummary:
    completed = sum(1 for s in job.sources if s.status == SourceItemStatus.COMPLETED)
    failed = sum(1 for s in job.sources if s.status == SourceItemStatus.FAILED)
    return JobSummary(
        id=job.id,
        name=job.name,
        status=job.status,
        source_type=job.source_config.source_type.value,
        total_sources=len(job.sources),
        completed_sources=completed,
        failed_sources=failed,
        total_rows=job.total_rows,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )

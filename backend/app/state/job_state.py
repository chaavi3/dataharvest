import json
from pathlib import Path

from ..models.job import Job

_JOBS_DIR = Path(__file__).resolve().parents[3] / "jobs"


def _jobs_dir() -> Path:
    _JOBS_DIR.mkdir(parents=True, exist_ok=True)
    return _JOBS_DIR


def _job_path(job_id: str) -> Path:
    return _jobs_dir() / f"{job_id}.json"


def save_job(job: Job) -> None:
    path = _job_path(job.id)
    path.write_text(
        json.dumps(job.model_dump(), indent=2),
        encoding="utf-8",
    )


def load_job(job_id: str) -> Job | None:
    path = _job_path(job_id)
    if not path.exists():
        return None
    raw = json.loads(path.read_text(encoding="utf-8"))
    return Job(**raw)


def list_jobs() -> list[Job]:
    jobs: list[Job] = []
    for path in sorted(_jobs_dir().glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
            jobs.append(Job(**raw))
        except Exception:
            continue
    return jobs


def delete_job_file(job_id: str) -> bool:
    path = _job_path(job_id)
    if path.exists():
        path.unlink()
        return True
    return False

"""Download endpoints for CSV/XLSX/HTML/PDF exports."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from ..core.exporter import export_csv, export_html, export_pdf, export_xlsx
from ..models.schema import ColumnDef
from ..state.job_state import load_job

router = APIRouter(prefix="/api/export", tags=["export"])


def _get_job_rows_and_columns(job_id: str) -> tuple[list[dict], list[ColumnDef], str]:
    job = load_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    rows: list[dict] = []
    for s in job.sources:
        rows.extend(s.extracted_rows)
    return rows, job.columns, job.name


@router.get("/{job_id}/csv")
async def download_csv(job_id: str):
    rows, columns, name = _get_job_rows_and_columns(job_id)
    data = export_csv(rows, columns)
    return Response(
        content=data,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{name}.csv"'},
    )


@router.get("/{job_id}/xlsx")
async def download_xlsx(job_id: str):
    rows, columns, name = _get_job_rows_and_columns(job_id)
    data = export_xlsx(rows, columns)
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{name}.xlsx"'},
    )


@router.get("/{job_id}/html")
async def download_html(job_id: str):
    rows, columns, name = _get_job_rows_and_columns(job_id)
    data = export_html(rows, columns, title=name)
    return Response(
        content=data,
        media_type="text/html",
        headers={"Content-Disposition": f'attachment; filename="{name}.html"'},
    )


@router.get("/{job_id}/pdf")
async def download_pdf(job_id: str):
    rows, columns, name = _get_job_rows_and_columns(job_id)
    data = export_pdf(rows, columns, title=name)
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{name}.pdf"'},
    )

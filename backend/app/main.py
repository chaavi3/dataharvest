"""DataHarvest FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from .api import auth as auth_module
from .api.auth import PinAuthMiddleware, login, logout
from .api.export import router as export_router
from .api.jobs import router as jobs_router
from .api.schemas import router as schemas_router
from .api.settings import router as settings_router
from .state.config import load_settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_settings()
    logger.info("DataHarvest backend started")
    yield
    from .core.fetcher import close_browser
    await close_browser()
    logger.info("DataHarvest backend stopped")


app = FastAPI(
    title="DataHarvest",
    description="AI-powered structured data extraction tool",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(PinAuthMiddleware)

app.include_router(jobs_router)
app.include_router(export_router)
app.include_router(settings_router)
app.include_router(schemas_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@app.post("/api/auth/login")
async def auth_login(data: dict):
    pin = data.get("pin", "")
    token = login(pin)
    if token is None:
        return JSONResponse(status_code=401, content={"detail": "Invalid PIN"})
    response = JSONResponse(content={"ok": True, "token": token})
    response.set_cookie("dh_session", token, httponly=True, samesite="lax", max_age=86400)
    return response


@app.get("/api/auth/status")
async def auth_status():
    settings = load_settings()
    return {"requires_pin": bool(settings.auth_pin_hash)}


@app.post("/api/auth/logout")
async def auth_logout(data: dict):
    token = data.get("token", "")
    logout(token)
    response = JSONResponse(content={"ok": True})
    response.delete_cookie("dh_session")
    return response


UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

from fastapi import File, UploadFile  # noqa: E402


@app.post("/api/upload-file")
async def upload_single_file(file: UploadFile = File(...)):
    dest = UPLOADS_DIR / file.filename
    content = await file.read()
    dest.write_bytes(content)
    return {"path": str(dest), "filename": file.filename, "size": len(content)}

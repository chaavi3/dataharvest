"""Settings / API key management endpoints."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..models.settings import AppSettings, BrowserSettings, ProviderConfig
from ..state.config import get_settings, hash_pin, load_settings, save_settings

router = APIRouter(prefix="/api/settings", tags=["settings"])


class ProviderKeyUpdate(BaseModel):
    provider: str
    api_key: str
    base_url: str | None = None
    default_model: str | None = None


class PinUpdate(BaseModel):
    pin: str | None = None


class BrowserUpdate(BaseModel):
    headless: bool | None = None
    user_agent: str | None = None
    proxy: str | None = None


class GeneralUpdate(BaseModel):
    default_provider: str | None = None
    serpapi_key: str | None = None
    rate_limit_rpm: int | None = None
    max_concurrency: int | None = None
    output_dir: str | None = None


@router.get("")
async def get_current_settings():
    s = get_settings()
    d = s.model_dump()
    for prov in d.get("providers", {}).values():
        key = prov.get("api_key", "")
        if key:
            prov["api_key"] = key[:4] + "..." + key[-4:] if len(key) > 8 else "***"
    if d.get("serpapi_key"):
        k = d["serpapi_key"]
        d["serpapi_key"] = k[:4] + "..." + k[-4:] if len(k) > 8 else "***"
    d["has_pin"] = bool(s.auth_pin_hash)
    d.pop("auth_pin_hash", None)
    return d


@router.put("/provider")
async def update_provider(data: ProviderKeyUpdate):
    settings = load_settings()
    cfg = settings.providers.get(data.provider)
    if cfg is None:
        settings.providers[data.provider] = ProviderConfig()
        cfg = settings.providers[data.provider]
    cfg.api_key = data.api_key
    if data.base_url is not None:
        cfg.base_url = data.base_url
    if data.default_model is not None:
        cfg.default_model = data.default_model
    save_settings(settings)
    return {"ok": True}


@router.put("/pin")
async def update_pin(data: PinUpdate):
    settings = load_settings()
    if data.pin:
        settings.auth_pin_hash = hash_pin(data.pin)
    else:
        settings.auth_pin_hash = None
    save_settings(settings)
    return {"ok": True}


@router.put("/browser")
async def update_browser(data: BrowserUpdate):
    settings = load_settings()
    if data.headless is not None:
        settings.browser.headless = data.headless
    if data.user_agent is not None:
        settings.browser.user_agent = data.user_agent
    if data.proxy is not None:
        settings.browser.proxy = data.proxy or None
    save_settings(settings)
    return {"ok": True}


@router.put("/general")
async def update_general(data: GeneralUpdate):
    settings = load_settings()
    if data.default_provider is not None:
        settings.default_provider = data.default_provider
    if data.serpapi_key is not None:
        settings.serpapi_key = data.serpapi_key
    if data.rate_limit_rpm is not None:
        settings.rate_limit_rpm = data.rate_limit_rpm
    if data.max_concurrency is not None:
        settings.max_concurrency = data.max_concurrency
    if data.output_dir is not None:
        settings.output_dir = data.output_dir
    save_settings(settings)
    return {"ok": True}

import hashlib
import json
from pathlib import Path

from ..models.settings import AppSettings

_CONFIG_PATH = Path(__file__).resolve().parents[3] / "config.json"
_settings_cache: AppSettings | None = None


def _config_path() -> Path:
    return _CONFIG_PATH


def load_settings() -> AppSettings:
    global _settings_cache
    path = _config_path()
    if path.exists():
        raw = json.loads(path.read_text(encoding="utf-8"))
        _settings_cache = AppSettings(**raw)
    else:
        _settings_cache = AppSettings()
        save_settings(_settings_cache)
    return _settings_cache


def save_settings(settings: AppSettings) -> None:
    global _settings_cache
    path = _config_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(settings.model_dump(), indent=2),
        encoding="utf-8",
    )
    _settings_cache = settings


def get_settings() -> AppSettings:
    if _settings_cache is None:
        return load_settings()
    return _settings_cache


def hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode()).hexdigest()


def verify_pin(pin: str) -> bool:
    settings = get_settings()
    if not settings.auth_pin_hash:
        return True
    return hash_pin(pin) == settings.auth_pin_hash

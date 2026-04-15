from typing import Optional

from pydantic import BaseModel


class ProviderConfig(BaseModel):
    api_key: str = ""
    base_url: Optional[str] = None
    default_model: str = ""


class BrowserSettings(BaseModel):
    headless: bool = True
    user_agent: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/131.0.0.0 Safari/537.36"
    )
    proxy: Optional[str] = None


class AppSettings(BaseModel):
    providers: dict[str, ProviderConfig] = {
        "openai": ProviderConfig(default_model="gpt-4o-mini"),
        "anthropic": ProviderConfig(default_model="claude-sonnet-4-20250514"),
        "gemini": ProviderConfig(default_model="gemini-2.0-flash"),
        "ollama": ProviderConfig(base_url="http://localhost:11434", default_model="llama3"),
        "openai_compat": ProviderConfig(default_model=""),
    }
    default_provider: str = "openai"
    serpapi_key: str = ""
    browser: BrowserSettings = BrowserSettings()
    rate_limit_rpm: int = 30
    max_concurrency: int = 3
    output_dir: str = "outputs"
    auth_pin_hash: Optional[str] = None

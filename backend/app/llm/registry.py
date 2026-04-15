from ..models.settings import AppSettings
from .anthropic_provider import AnthropicProvider
from .base import LLMProvider
from .gemini_provider import GeminiProvider
from .ollama_provider import OllamaProvider
from .openai_compat import OpenAICompatProvider
from .openai_provider import OpenAIProvider


def get_provider(settings: AppSettings, provider_name: str | None = None, model: str | None = None) -> LLMProvider:
    name = provider_name or settings.default_provider
    cfg = settings.providers.get(name)
    if cfg is None:
        raise ValueError(f"Unknown provider: {name}")

    chosen_model = model or cfg.default_model

    if name == "openai":
        return OpenAIProvider(api_key=cfg.api_key, model=chosen_model, base_url=cfg.base_url)
    if name == "anthropic":
        return AnthropicProvider(api_key=cfg.api_key, model=chosen_model)
    if name == "gemini":
        return GeminiProvider(api_key=cfg.api_key, model=chosen_model)
    if name == "ollama":
        return OllamaProvider(base_url=cfg.base_url or "http://localhost:11434", model=chosen_model)
    if name == "openai_compat":
        if not cfg.base_url:
            raise ValueError("openai_compat provider requires a base_url in settings")
        return OpenAICompatProvider(api_key=cfg.api_key, model=chosen_model, base_url=cfg.base_url)

    raise ValueError(f"Unsupported provider: {name}")

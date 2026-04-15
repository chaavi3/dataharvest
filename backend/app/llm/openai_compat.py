"""Generic OpenAI-compatible endpoint provider (Groq, Together, Azure, vLLM, etc.)."""

from .openai_provider import OpenAIProvider


class OpenAICompatProvider(OpenAIProvider):
    """Identical to the OpenAI provider but requires an explicit base_url."""

    def __init__(self, api_key: str, model: str, base_url: str):
        super().__init__(api_key=api_key, model=model, base_url=base_url)

from abc import ABC, abstractmethod


class LLMProvider(ABC):
    @abstractmethod
    async def extract_structured(
        self,
        content: str,
        columns: list[dict],
        system_prompt: str | None = None,
    ) -> list[dict]:
        """Send content + column definitions to the LLM
        and return a list of row dicts matching the column names."""
        ...

    @abstractmethod
    async def suggest_schema(self, content: str) -> list[dict]:
        """Analyse sample content and propose column definitions."""
        ...

    @abstractmethod
    async def chat(self, messages: list[dict]) -> str:
        """Generic chat completion."""
        ...

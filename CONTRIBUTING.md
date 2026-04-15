# Contributing to DataHarvest

Thank you for your interest in contributing! This document covers development setup, coding conventions, and the pull request process.

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
```

Run the backend in development mode:

```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server runs on port 3000 and proxies `/api/*` requests to the backend on port 8000.

## Project Structure

- `backend/app/api/` -- FastAPI route handlers
- `backend/app/core/` -- Core business logic (source resolution, fetching, extraction, export)
- `backend/app/llm/` -- LLM provider implementations
- `backend/app/models/` -- Pydantic data models
- `backend/app/state/` -- File-based state management
- `frontend/src/app/` -- Next.js pages
- `frontend/src/components/` -- React components
- `frontend/src/lib/` -- API client, types, utilities

## Adding a New LLM Provider

1. Create `backend/app/llm/your_provider.py` implementing the `LLMProvider` abstract class from `base.py`
2. Register it in `backend/app/llm/registry.py`
3. Add a default config entry in `backend/app/models/settings.py`
4. Add the provider option to the frontend Settings page and job config

## Adding a New Source Type

1. Add the type to the `SourceType` enum in `backend/app/models/source.py`
2. Handle resolution in `backend/app/core/source_resolver.py`
3. Add the UI option in `frontend/src/components/source-input.tsx`

## Adding a New Document Parser

1. Add handling for the file extension in `backend/app/core/document_parser.py`
2. Update the file accept list in `frontend/src/components/source-input.tsx`
3. Add the required Python dependency to `requirements.txt`

## Code Style

- **Python:** Follow PEP 8. Use type hints. Keep functions focused.
- **TypeScript:** Follow the existing patterns. Use TypeScript types, not `any`.
- **Commits:** Write concise commit messages. Reference issues where applicable.
- **No commented-out code** in pull requests.

## Pull Request Process

1. Fork the repo and create a feature branch from `main`
2. Make your changes with clear, focused commits
3. Ensure the backend starts without errors: `python -c "from app.main import app"`
4. Ensure the frontend builds: `cd frontend && npm run build`
5. Open a PR with a description of what changed and why
6. Respond to review feedback

## Reporting Issues

Open a GitHub issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your environment (OS, Python version, Node version)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

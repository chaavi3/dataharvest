# DataHarvest

**AI-powered structured data extraction from any source.**

Point DataHarvest at web pages, documents, search results, or Google Drive links -- define the columns you want -- and get back clean structured data as CSV, Excel, HTML, or PDF.

## Features

- **Multiple source types** -- single URL, URL lists, hub pages with link discovery, keyword search (SerpAPI), document uploads (PDF/DOCX/XLSX/TXT/HTML/MD), Google Drive public links, and LLM-guided navigation
- **Schema-driven extraction** -- define column names and descriptions; the LLM extracts exactly what you need
- **Auto-suggest schema** -- let the AI analyze a sample page and propose columns for you
- **Multi-provider LLM support** -- OpenAI, Anthropic Claude, Google Gemini, Ollama (local), or any OpenAI-compatible endpoint
- **Resumable jobs** -- file-based state persistence; pause, resume, or retry failed sources at any time
- **Export formats** -- CSV, XLSX (Excel), HTML, PDF
- **Web UI** -- clean dashboard, step-by-step job wizard, live progress tracking, data preview with search/sort
- **Settings UI** -- manage API keys, browser config, rate limits, and optional PIN authentication
- **Schema templates** -- save and reuse column definitions across jobs

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Chromium browser (installed automatically by Playwright)

### 1. Clone and install

```bash
git clone https://github.com/chaavi3/dataharvest.git
cd dataharvest

# Backend
cd backend
pip install -r requirements.txt
playwright install chromium
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### 2. Start the servers

In two terminals:

```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 3. Open the UI

Visit **http://localhost:3000** in your browser.

### 4. Configure API keys

Go to **Settings** and enter your LLM provider API key (at minimum, an OpenAI key). Optionally add a SerpAPI key for keyword-based search.

> **Security note:** API keys are stored in plain text inside `config.json`. This file is already in `.gitignore` so it will not be committed to the repository. **Never commit `config.json` to version control.** See the [Security](#security) section below for details.

### 5. Create your first job

Click **New Job**, choose a source type, define your columns, preview the results, and run!

## Docker

```bash
docker-compose up --build
```

This starts both the backend (port 8000) and frontend (port 3000). Job state and uploads are persisted via volume mounts.

## Architecture

```
dataharvest/
  backend/           # FastAPI (Python)
    app/
      api/           # REST endpoints (jobs, settings, export, templates, auth)
      core/          # Business logic (source resolver, fetcher, extractor, merger, exporter)
      llm/           # LLM provider abstraction (OpenAI, Anthropic, Gemini, Ollama, etc.)
      models/        # Pydantic data models
      state/         # File-based persistence (job state, config)
  frontend/          # Next.js (TypeScript)
    src/
      app/           # Pages (dashboard, job wizard, job detail, settings, templates)
      components/    # Reusable UI components
      lib/           # API client, types, utilities
  jobs/              # Job state JSON files (runtime)
  uploads/           # Uploaded documents (runtime)
```

### Extraction Pipeline

1. **Source Resolution** -- user input is resolved into concrete URLs or file paths
2. **Fetching** -- Playwright renders web pages; parsers extract text from documents
3. **LLM Extraction** -- page content + column schema is sent to the LLM, which returns structured rows
4. **Merge & Validate** -- rows from all sources are combined, type-checked, and deduplicated
5. **Export** -- final data is exported to the user's chosen format(s)

## Configuration

Settings are managed through the web UI (**Settings** page) and stored in `config.json`. Available options:

| Setting | Description |
|---------|-------------|
| LLM API Keys | Per-provider keys for OpenAI, Anthropic, Gemini, Ollama, OpenAI-compatible |
| Default Provider | Which LLM provider to use by default |
| SerpAPI Key | For keyword-based source discovery |
| Browser Settings | Headless mode, user agent, proxy |
| Rate Limit | Max requests per minute |
| Concurrency | Max parallel source processing workers |
| Auth PIN | Optional PIN to protect access |

## Supported Document Types

| Format | Extension | Parser |
|--------|-----------|--------|
| PDF | .pdf | pdfplumber |
| Word | .docx | python-docx |
| Excel | .xlsx, .xls | openpyxl |
| Plain Text | .txt | built-in |
| HTML | .html, .htm | built-in |
| Markdown | .md | built-in |
| CSV | .csv | built-in |

## Security

DataHarvest stores API keys in `config.json` at the project root in **plain text**. This is a local-only tool and the keys never leave your machine (except when calling the LLM provider APIs), but you should be aware of the following:

- **`config.json` is gitignored.** It will not be committed to the repository by default. **Do not remove it from `.gitignore`, and never commit this file.**
- **Do not share `config.json`.** If you copy or zip the project folder, exclude `config.json` or delete the keys first.
- **Set a spending limit** on your LLM provider account (e.g., [OpenAI usage limits](https://platform.openai.com/settings/organization/limits)). This caps your exposure even if a key is accidentally leaked.
- **Rotate keys immediately** if you suspect they have been exposed. All major providers let you revoke and regenerate keys from their dashboard.
- **Use Ollama for zero-risk local inference.** If you prefer not to use cloud API keys at all, DataHarvest supports [Ollama](https://ollama.com/) for fully local LLM processing.

### Files that may contain secrets

| File | Contains | Gitignored |
|------|----------|------------|
| `config.json` | LLM API keys, SerpAPI key | Yes |
| `jobs/*.json` | Job state (no keys) | Yes |
| `.env` / `.env.local` | Environment variables (if used) | Yes |

If you fork this repo or create a public copy, double-check that none of these files are included.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, guidelines, and how to submit pull requests.

## License

MIT -- see [LICENSE](LICENSE).

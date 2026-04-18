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

## Setup Guide (from scratch)

Complete step-by-step instructions for a fresh Windows, macOS, or Linux machine.

### Step 1: Install Python 3.11+

- **Windows:** Download from [python.org/downloads](https://www.python.org/downloads/). During installation, **check "Add Python to PATH"**.
- **macOS:** `brew install python@3.11` (or download from python.org)
- **Linux:** `sudo apt install python3.11 python3.11-venv python3-pip` (Ubuntu/Debian) or equivalent for your distro.

Verify: open a terminal and run `python --version` (or `python3 --version`). You should see 3.11 or higher.

### Step 2: Install Node.js 18+

- Download the LTS version from [nodejs.org](https://nodejs.org/).
- On macOS: `brew install node` also works.

Verify: `node --version` and `npm --version`.

### Step 3: Get an LLM API key

You need at least one LLM provider key. Options:

| Provider | Where to get a key | Cost |
|---|---|---|
| **OpenAI** (recommended) | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | Pay-as-you-go; GPT-4o-mini is ~$0.15/M input tokens |
| **Anthropic Claude** | [console.anthropic.com](https://console.anthropic.com/) | Pay-as-you-go |
| **Google Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Free tier available |
| **Ollama** (fully local) | [ollama.com](https://ollama.com/) | Free, no API key needed |

We recommend **setting a spending limit** on your provider account to cap costs.

### Step 4: Clone the repository

```bash
git clone https://github.com/chaavi3/dataharvest.git
cd dataharvest
```

### Step 5: Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

On macOS/Linux you may need `pip3` instead of `pip`. If you prefer an isolated environment:

```bash
python -m venv .venv
# Windows:   .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
```

### Step 6: Install the Playwright browser

DataHarvest uses Playwright to render web pages in a headless Chromium browser:

```bash
playwright install chromium
```

### Step 7: Install frontend dependencies

Open a new terminal (or navigate back to the repo root):

```bash
cd frontend
npm install
```

### Step 8: Start the backend server

From the repo root:

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Leave this terminal running. You should see output like `Uvicorn running on http://127.0.0.1:8000`.

### Step 9: Start the frontend server

Open a **second terminal** and from the repo root:

```bash
cd frontend
npm run dev
```

Leave this terminal running. You should see output like `ready - started server on http://localhost:3000`.

### Step 10: Open the UI and configure API keys

1. Open **http://localhost:3000** in your browser (Chrome, Edge, Firefox, etc.)
2. Click **Settings**
3. Enter your LLM provider API key (e.g., your OpenAI key)
4. Set the **Default Provider** to match (e.g., OpenAI)
5. Save

> **Security note:** API keys are stored in plain text inside `config.json`. This file is gitignored and will not be committed to the repository. **Never commit `config.json` to version control.** See the [Security](#security) section below for details.

### Step 11: Create your first job

1. Click **New Job**
2. Choose a source type (e.g., "Single URL" to test with one page)
3. Define the columns you want extracted (name, description, type)
4. Preview the results, then run the job
5. Once complete, click **CSV** (or XLSX/HTML/PDF) to export your data

### Stopping the servers

Press `Ctrl+C` in each terminal window to stop the backend and frontend servers.

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

## Recipes

The [recipes/](recipes/) folder contains step-by-step guides for specific use cases (e.g., scraping IPL cricket stats, extracting product listings, etc.). See the [recipes README](recipes/README.md) for the full list. Contributions welcome -- add your own and open a PR!

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, guidelines, and how to submit pull requests.

## License

MIT -- see [LICENSE](LICENSE).

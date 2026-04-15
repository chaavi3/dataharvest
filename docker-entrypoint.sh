#!/bin/bash
set -e

cd /app/frontend && npx next start -p 3000 &

cd /app/backend && uvicorn app.main:app --host 0.0.0.0 --port 8000

wait

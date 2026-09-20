# Geophysics Sandbox

A personal interactive computational learning lab for geophysics principles, numerical algorithms, and scientific visualizations across seismology, potential fields, and signal processing.

Created by Mochammad Naufal Septifiandi @ 2026  
Licensed under Apache 2.0

---

## Quick Start

### 1. Backend API (FastAPI)
```bash
cd backend
pnpm run dev
# (or: uv run uvicorn app.main:app --reload --port 8000)
```
- API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)
- Tests: `pnpm test` (or `uv run pytest`)

### 2. Frontend App (React 19 + Vite)
```bash
cd frontend
pnpm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)
- Tests: `pnpm test`
- Build: `pnpm run build`
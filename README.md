# Geophysics Sandbox 🌍⚡

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![DaisyUI](https://img.shields.io/badge/DaisyUI-5.7.42-1ad1a5?style=flat-square&logo=daisyui)](https://daisyui.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776ab?style=flat-square&logo=python)](https://www.python.org/)
[![NumPy](https://img.shields.io/badge/NumPy-2.5+-013243?style=flat-square&logo=numpy)](https://numpy.org/)
[![SciPy](https://img.shields.io/badge/SciPy-1.18+-8caae6?style=flat-square&logo=scipy)](https://scipy.org/)
[![Apache ECharts](https://img.shields.io/badge/ECharts-6.1+-e43c59?style=flat-square&logo=apacheecharts)](https://echarts.apache.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](LICENSE)

An interactive computational sandbox designed as a personal laboratory for learning geophysics. As I study textbooks, research papers, and industry references, this sandbox serves as the canvas where theoretical concepts are transformed into numerical algorithms and interactive visualizations.

---

## 🧭 System Overview

The sandbox is architected as a modern, decoupled full-stack application:

```mermaid
graph LR
    subgraph UI ["Frontend (React 19 + Vite)"]
        Sidebar["Collapsible Sidebar<br/>(Domain Categories)"]
        Canvas["Interactive Canvas<br/>(Apache ECharts / Fallback)"]
        Theme["FOUC-Free Theme Engine<br/>(DaisyUI 5.7)"]
    end

    subgraph API ["Backend (FastAPI + uv)"]
        Server["FastAPI Router (/api/v1)"]
        Engine["Scientific Compute<br/>(NumPy + SciPy)"]
        Plotter["Base64 Chart Engine<br/>(Matplotlib)"]
    end

    Sidebar --> Canvas
    Canvas <-->|Structured JSON Array Data| Server
    Server --> Engine
    Engine --> Plotter
```

- **Frontend**: Built with React 19, TypeScript, Tailwind CSS v4, and DaisyUI v5.7.42. Routing is file-based via TanStack Router with TanStack Query caching.
- **Backend**: Powered by Python 3.12, FastAPI, NumPy, SciPy, and Matplotlib, managed with `uv`.
- **Visualization**: Primary plotting uses Apache ECharts for reactive, 60fps vector graphics with seamless dark/light theme switching. Complex geological and seismic gathers fall back to server-generated Matplotlib images.

For detailed architecture diagrams, request lifecycles, and module implementation recipes, see **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## ⚡ Prerequisites

Make sure you have the following installed on your machine:
- **Node.js** >= 20.x
- **pnpm** >= 9.x (`npm install -g pnpm`)
- **Python** >= 3.12
- **uv** (Recommended Python package manager: `curl -LsSf https://astral.sh/uv/install.sh` or `pip install uv`)

---

## 🚀 Quick Start

### 1. Setup & Start the Backend (FastAPI)
```bash
cd backend

# Install dependencies (automatic with uv)
uv sync

# Run development server with hot-reload
pnpm run dev
# (or directly: uv run uvicorn app.main:app --reload --port 8000)
```
- Interactive API Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check Endpoint: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### 2. Setup & Start the Frontend (React + Vite)
```bash
cd frontend

# Install dependencies
pnpm install

# (Optional) Copy environment template
cp .env.example .env

# Run Vite dev server
pnpm run dev
```
- Interactive Web App: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Running Automated Tests

Both frontend and backend include automated test suites:

```bash
# Run backend tests (Pytest + HTTPX)
cd backend
pnpm test

# Run frontend tests (Vitest + React Testing Library)
cd frontend
pnpm test

# Run frontend production build
cd frontend
pnpm run build
```

---

## 🗺️ Geophysics Domain Roadmap

Topics planned to be built out iteratively as learning progresses:

| Domain | Topic / Module | Visualization Engine | Status |
| :--- | :--- | :--- | :---: |
| **Seismology** | Ricker & Ormsby Wavelets | Apache ECharts | Planned |
| **Seismology** | Snell's Law & Ray Tracing | Apache ECharts | Planned |
| **Seismology** | Normal Moveout (NMO) Correction | ECharts / Matplotlib | Planned |
| **Seismology** | Zoeppritz Reflection Coefficients (AVO) | Apache ECharts | Planned |
| **Potential Fields** | Gravity Anomaly of a Sphere & Cylinder | Apache ECharts | Planned |
| **Potential Fields** | Magnetic Dipole Anomalies | Apache ECharts | Planned |
| **Signal Processing** | Discrete Fourier Transform & FFT | Apache ECharts | Planned |
| **Signal Processing** | Convolution & Synthetic Seismograms | Apache ECharts | Planned |
| **Signal Processing** | Bandpass & Notch Filtering | Apache ECharts | Planned |
| **Petrophysics** | Archie's Equation (Water Saturation) | Apache ECharts | Planned |
| **Petrophysics** | Wyllie Time-Average Equation (Sonic Porosity) | Apache ECharts | Planned |

---

## 🛠️ How to Add a New Topic

To add a new geophysics topic, follow the 3-tier modular workflow:
1. **Compute**: Write pure scientific formulas in `backend/app/modules/<domain>/<topic>.py`.
2. **API**: Expose parameters and results in `backend/app/api/v1/<domain>/<topic>.py`.
3. **UI**: Create route in `frontend/src/routes/<domain>/<topic>.tsx` with parameter sliders and `<EChart />`.
4. **Register**: Add the route to `frontend/src/components/layout/Sidebar.tsx`.

See the complete step-by-step tutorial with code examples in **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## 📄 License

Created by **Mochammad Naufal Septifiandi** @ 2026.  
Licensed under the [Apache License, Version 2.0](LICENSE).
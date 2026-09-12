# ⚡ Evalora — Next-Gen B2B AI Technical Assessment & Interview Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org)
[![Qdrant](https://img.shields.io/badge/Qdrant-Vector_DB-dc2626?style=flat-square&logo=qdrant)](https://qdrant.tech)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16--alpine-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.3-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

**Evalora** is an enterprise-grade, B2B AI-driven technical assessment and live interview simulation platform. Designed for modern hiring teams, Evalora automates candidate screening, resume vector matching, multi-tenant RAG knowledge base indexing, and real-time interactive technical interviews via WebSockets.

---

## 🌟 Key Features

- **🤖 Automated Job & Rubric Extraction**: Transform plain text Job Descriptions and grounding PDF resources into structured JSON schemas (skills, technical requirements, core responsibilities, and seniority levels) powered by LLMs.
- **🔍 Multi-Tenant RAG Vector Engine**: Automatic chunking and dense vector indexing into **Qdrant** (`job_knowledge_base` & `resume_embeddings`). Strict `job_id` payload isolation guarantees enterprise multi-tenant privacy.
- **📄 Resume Analysis & AI Match Scoring**: Parses candidate resumes, computes semantic vector similarity scores against job requirements, and ranks applicants dynamically.
- **🎙️ Real-Time WebSocket Technical Interviews**: Live simulated technical interviews with real-time text/voice interaction, dynamic follow-up generation, and real-time candidate assessment.
- **📊 Recruiter & Candidate Portals**: Next.js 14 dashboard with live analytics, applicant pipeline counters, job creation modal with PDF grounding support, and interactive candidate interview interface.
- **🐳 One-Command Infrastructure**: Docker Compose orchestration for PostgreSQL 16 and Qdrant Vector Engine.

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    subgraph Client Layer
        FE[Next.js 14 Frontend / Dashboard]
        WS_Client[WebSocket Client / Candidate Portal]
    end

    subgraph API Gateway / Backend
        API[FastAPI Application Server]
        WS[WebSocket Live Interview Engine]
    end

    subgraph RAG & Intelligence
        LLM[LangChain / Google GenAI / LiteLLM]
        RAG[RAG Retrieval & Matching Engine]
    end

    subgraph Data Persistence
        PG[(PostgreSQL 16\nRelational DB)]
        QDRANT[(Qdrant Vector DB\nHybrid & Dense Search)]
    end

    FE -->|REST API| API
    WS_Client <-->|Bi-directional WebSockets| WS
    API -->|Async ORM| PG
    API -->|Vector Upsert/Search| QDRANT
    WS -->|Context Retrieval| RAG
    RAG -->|Semantic Query| QDRANT
    RAG -->|Generate Response| LLM
```

---

## 🛠️ Tech Stack

### **Backend**
- **Framework**: FastAPI (Python 3.11+)
- **ORM & Database**: Async SQLAlchemy 2.0 + AsyncPG, PostgreSQL 16
- **Vector Engine**: Async Qdrant Client (Hybrid/Dense Search)
- **AI & RAG Engine**: LangChain, FastEmbed / sentence-transformers, Google GenAI SDK, PyPDF
- **Real-Time Communication**: FastAPI WebSockets
- **Testing**: pytest & pytest-asyncio

### **Frontend**
- **Framework**: Next.js 14 (App Router) & React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **HTTP Client**: Native Fetch API / Custom Async Handlers

---

## 📁 Directory Structure

```
evalora/
├── app/                        # FastAPI Backend Application
│   ├── api/                    # API Routers
│   │   ├── v1/                 # REST Endpoints (Jobs, Candidates, Interviews)
│   │   └── websockets/         # Live Interview WebSocket Handlers
│   ├── core/                   # System Configuration, Database & Qdrant setup
│   ├── models/                 # SQLAlchemy Async Database Models
│   ├── schemas/                # Pydantic v2 Validation Schemas
│   ├── services/               # RAG Engine, LLM Job Extractor & Candidate Seeder
│   └── main.py                 # FastAPI Application Entry Point
├── frontend/                   # Next.js 14 Frontend Application
│   ├── app/                    # Next.js App Router (Dashboard, Jobs, Apply, Demo)
│   ├── components/             # Reusable UI Components
│   ├── lib/                    # API Utilities & Helper Functions
│   └── package.json
├── docker-compose.yml          # Container configuration for Postgres & Qdrant
├── requirements.txt            # Python Dependencies
├── AGENTS.md                   # Agent Architecture & Constraints
└── README.md                   # System Documentation
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** & `npm` installed
- **Docker & Docker Compose** installed

---

### 2. Infrastructure Setup (PostgreSQL & Qdrant)

Launch PostgreSQL and Qdrant vector database via Docker Compose:

```bash
docker-compose up -d
```

- **PostgreSQL**: Running on port `5433` (`evalora_db`)
- **Qdrant Vector DB**: REST API & Dashboard on `http://localhost:6333`

---

### 3. Backend Setup

1. **Create and activate a virtual environment**:
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On Linux/macOS:
   source venv/bin/activate
   ```

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables** (Optional, defaults set in code):
   ```env
   DATABASE_URL=postgresql+asyncpg://evalora:evalorasecret@localhost:5433/evalora_db
   QDRANT_HOST=localhost
   QDRANT_PORT=6333
   ```

4. **Start the FastAPI Backend**:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   - **Interactive API Documentation (Swagger)**: `http://localhost:8000/docs`
   - **ReDoc**: `http://localhost:8000/redoc`

---

### 4. Frontend Setup

1. **Navigate to the frontend folder**:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Launch Next.js development server**:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000` in your browser to view the **Evalora Recruiter Dashboard**.

---

## 📡 API Endpoints Reference

### **Jobs API** (`/api/v1/jobs`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/jobs` | Create job position with plain text description & optional resource PDFs |
| `GET` | `/api/v1/jobs` | Get all job positions enriched with real-time analytics & pipeline counters |
| `GET` | `/api/v1/jobs/{job_id}` | Retrieve single job details, rubric settings, and candidate metrics |

### **Candidates API** (`/api/v1/candidates`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/candidates` | Register candidate & parse resume into Qdrant vector database |
| `GET` | `/api/v1/candidates?job_id={job_id}` | List candidates filtered by job position with match scores |
| `GET` | `/api/v1/candidates/{candidate_id}` | Get candidate details & match analysis |

### **Interviews & WebSockets API** (`/api/v1/interviews`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/interviews/invite` | Generate and dispatch unique interview invite link for candidate |
| `GET` | `/api/v1/interviews/{interview_id}` | Get interview session status & rubric evaluation report |
| `WS` | `/api/v1/ws/interview/{interview_id}` | Real-time bi-directional WebSocket session for AI-conducted interview |

---

## 🧪 Running Tests

Execute the automated test suite with pytest:

```bash
pytest tests/
```

---

## 🔐 Multi-Tenant Security & Isolation Rules

1. **Strict Payload Filtering**: All Qdrant vector queries and point upserts MUST include a payload filter for `job_id` to guarantee isolation between job positions and tenants.
2. **Async Operations**: All database operations use SQLAlchemy 2.0 `AsyncSession`, and all Qdrant vector calls utilize `AsyncQdrantClient`.

---

## 📄 License

This project is proprietary and confidential. Built for enterprise B2B assessment operations.

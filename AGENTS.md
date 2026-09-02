# GEMINI.md / AGENTS.md

## Project Context
**Evalora**: B2B AI-driven interview simulation and technical assessment platform.
- **Backend**: FastAPI (Python 3.11+), Pydantic v2, WebSockets
- **Primary Database**: PostgreSQL (Async SQLAlchemy 2.0)
- **Vector Database**: Qdrant (Hybrid search / dense embeddings)
- **AI/LLM Stack**: LangChain / LangGraph, LiteLLM / Google GenAI SDK, FastEmbed / sentence-transformers

## Core Architecture & Qdrant Collections
1. `job_knowledge_base`:
   - Vectors: Dense (1536/768-dim) for technical documents, JDs, and rubric criteria.
   - Payload: `{"job_id": str, "source_type": "jd"|"rubric"|"doc", "chunk_id": str, "content": str}`
2. `resume_embeddings`:
   - Vectors: Resume dense embeddings for similarity matching.
   - Payload: `{"candidate_id": str, "job_id": str, "skills": list[str], "experience_years": float}`

## Critical Agent Constraints
1. **Qdrant Isolation**: Every vector search and point upsert MUST be filtered by `job_id` payload to ensure strict multi-tenant isolation.
2. **Schema Integrity**: Never make breaking changes to database models or API routes without explicit review.
3. **Async Standard**: All DB sessions and Qdrant client calls must use `AsyncQdrantClient` and `AsyncSession`.
4. **Verification Loop**: Run `pytest tests/` after modifying core services before declaring tasks complete.
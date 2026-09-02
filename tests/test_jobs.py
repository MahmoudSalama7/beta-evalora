import pytest
from fastapi.testclient import TestClient

from unittest.mock import AsyncMock, patch
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.core.database import Base, get_db

# Use in-memory SQLite database for tests
test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def override_get_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@patch("app.api.v1.jobs.extract_job_metadata", new_callable=AsyncMock)
@patch("app.api.v1.jobs.index_job_knowledge_base", new_callable=AsyncMock)
def test_create_job_form_plain_text(mock_index, mock_extract):
    mock_extract.return_value = {
        "skills": ["Python", "FastAPI", "PostgreSQL"],
        "technical_requirements": ["3+ years experience with async python"],
        "seniority_level": "Senior",
        "core_responsibilities": ["Design RESTful APIs"]
    }
    mock_index.return_value = 5

    data = {
        "title": "Lead Python Developer",
        "description": "We are seeking a Lead Python Developer with deep FastAPI and Qdrant experience."
    }
    
    response = client.post("/api/v1/jobs", data=data)
    assert response.status_code == 201
    res = response.json()
    
    assert res["title"] == data["title"]
    assert res["description"] == data["description"]
    assert res["skills"] == ["Python", "FastAPI", "PostgreSQL"]
    assert res["seniority_level"] == "Senior"
    assert res["indexed_chunks"] == 5
    assert "id" in res

def test_heuristic_extractor_fallback():
    from app.services.job_extractor import heuristic_extraction
    desc = "Looking for Senior engineer with Python, Docker and PostgreSQL skills to lead backend architecture."
    result = heuristic_extraction(desc)
    
    assert "skills" in result
    assert "Python" in result["skills"]
    assert "Postgresql" in result["skills"] or "Postgres" in result["skills"]
    assert result["seniority_level"] == "Senior"

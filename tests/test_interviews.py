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

@patch("app.api.v1.interviews.generate_grounded_questions", new_callable=AsyncMock)
@patch("app.api.v1.jobs.index_job_knowledge_base", new_callable=AsyncMock)
@patch("app.api.v1.jobs.extract_job_metadata", new_callable=AsyncMock)
def test_full_interview_and_privacy_access_control(mock_extract, mock_index, mock_gen_q):
    mock_extract.return_value = {"skills": ["Python", "FastAPI"]}
    mock_index.return_value = 2
    mock_gen_q.return_value = ["What is FastAPI?", "Explain Qdrant."]

    # 1. Create Job
    job_res = client.post("/api/v1/jobs", data={"title": "Backend Dev", "description": "Python FastAPI role"})
    assert job_res.status_code == 201
    job_id = job_res.json()["id"]

    # 2. Start Candidate Interview
    int_res = client.post("/api/v1/interviews", json={"job_id": job_id, "candidate_id": "cand_123"})
    assert int_res.status_code == 201
    int_data = int_res.json()
    interview_id = int_data["id"]

    # 3. Test Candidate View Privacy: Candidate endpoint MUST NOT return scores or evaluations
    cand_view = client.get(f"/api/v1/interviews/{interview_id}")
    assert cand_view.status_code == 200
    cand_json = cand_view.json()
    assert "technical_score" not in cand_json
    assert "clarity_score" not in cand_json
    assert "covered_points" not in cand_json
    assert cand_json["status"] == "in_progress"

    # 4. Test HR Report Endpoint: HR gets complete evaluation report
    hr_report = client.get(f"/api/v1/interviews/{interview_id}/report")
    assert hr_report.status_code == 200
    hr_json = hr_report.json()
    assert "overall_technical_score" in hr_json
    assert "overall_clarity_score" in hr_json
    assert "turns" in hr_json
    assert len(hr_json["turns"]) == 2

def test_evaluator_schema_keys():
    from app.services.evaluator import heuristic_evaluator
    res = heuristic_evaluator("Question", "Answer with enough technical detail for evaluation.", ["ground truth"])
    assert isinstance(res["technical_score"], float)
    assert isinstance(res["clarity_score"], float)
    assert isinstance(res["covered_points"], list)
    assert isinstance(res["missing_points"], list)
    assert isinstance(res["summary"], str)

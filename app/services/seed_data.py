import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.interview import Job, Candidate, CandidateReport, Interview, InterviewTurn

DEFAULT_JOBS = [
    {
        "title": "Senior Full-Stack AI Engineer",
        "seniority_level": "Senior",
        "description": "We are looking for a Senior Full-Stack Engineer with 4+ years of experience in Python, FastAPI, React, and Async PostgreSQL. You will design scalable AI-driven interview services and integrate Qdrant vector databases for RAG question generation.",
        "skills": ["Python", "FastAPI", "React", "TypeScript", "Qdrant", "PostgreSQL", "LangChain"],
        "technical_requirements": ["4+ years software engineering experience", "Proficiency in FastAPI & AsyncIO", "Hands-on experience with Qdrant / Vector Databases"],
        "core_responsibilities": ["Architect high-availability AI assessment pipelines", "Integrate RAG vector engines with Qdrant", "Develop responsive Next.js frontend interfaces"]
    },
    {
        "title": "Lead Backend Infrastructure Engineer",
        "seniority_level": "Lead",
        "description": "Lead architect responsible for building high-concurrency microservices, managing PostgreSQL & Redis connection pools, orchestrating Docker containers, and optimizing real-time WebSocket communication channels.",
        "skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Redis", "WebSockets", "AsyncPG"],
        "technical_requirements": ["5+ years distributed systems background", "Deep understanding of AsyncPG connection pooling", "Expertise in Docker & Kubernetes deployment"],
        "core_responsibilities": ["Maintain system reliability and sub-second API latency", "Design multi-tenant database isolation strategies", "Lead backend infrastructure roadmap"]
    }
]

SEED_CANDIDATES = [
    {
        "name": "Sarah Jenkins",
        "email": "sarah.jenkins@example.com",
        "match_score": 92.5,
        "matched_skills": ["Python", "FastAPI", "LangChain", "PostgreSQL", "Qdrant"],
        "missing_skills": ["Kubernetes"],
        "status": "interview_completed",
        "report": {
            "overall_score": 91.5,
            "recommendation": "Strong Hire",
            "technical_score": 94.0,
            "communication_score": 88.5,
            "confidence_score": 92.0,
            "tab_switch_count": 0,
            "gaze_warnings": 1,
            "recording_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            "turns_detail": [
                {
                    "turn_index": 0,
                    "question": "How do you enforce multi-tenant isolation in Qdrant vector retrieval?",
                    "candidate_transcript": "We pass a payload filter containing the specific job_id to every vector query in Qdrant. This guarantees candidates only retrieve chunks pertinent to their targeted position.",
                    "qdrant_ground_truth_context": "Qdrant payload filters MUST specify job_id matching payload filters prior to HNSW similarity search to maintain complete tenant isolation.",
                    "covered_points": ["Payload filter usage", "job_id scoping", "Multi-tenant data isolation"],
                    "missing_points": ["gRPC vs REST endpoint optimization"],
                    "turn_score": 9.5,
                    "timestamp_seconds": 10
                },
                {
                    "turn_index": 1,
                    "question": "Explain your strategy for async database connection pooling with SQLAlchemy 2.0.",
                    "candidate_transcript": "I instantiate an AsyncEngine using create_async_engine and wrap it in async_sessionmaker. In FastAPI routers, we yield the AsyncSession via dependency injection.",
                    "qdrant_ground_truth_context": "AsyncSession Local generator leverages async_sessionmaker bound to asyncpg. Connection pools are sized based on concurrency requirements.",
                    "covered_points": ["AsyncEngine creation", "async_sessionmaker wrapper", "FastAPI Depends lifecycle"],
                    "missing_points": ["Max overflow tuning under heavy load"],
                    "turn_score": 9.0,
                    "timestamp_seconds": 45
                },
                {
                    "turn_index": 2,
                    "question": "How do you evaluate LLM response accuracy against job knowledge base rubrics?",
                    "candidate_transcript": "We utilize structured outputs with Pydantic schemas, prompting the model to compare candidate answers against retrieved Qdrant ground truth context chunks and compute covered vs missing points.",
                    "qdrant_ground_truth_context": "Rubric evaluation parses JSON schemas returning technical ratings, clarity scores, covered criteria, and missing points based on indexed JDs.",
                    "covered_points": ["Pydantic schema validation", "Ground-truth comparison", "Rubric point extraction"],
                    "missing_points": ["Few-shot prompt calibration"],
                    "turn_score": 9.0,
                    "timestamp_seconds": 90
                }
            ]
        }
    },
    {
        "name": "Alex Rivera",
        "email": "alex.rivera@example.com",
        "match_score": 84.0,
        "matched_skills": ["Python", "React", "TypeScript", "SQL"],
        "missing_skills": ["Qdrant", "LangChain"],
        "status": "interview_completed",
        "report": {
            "overall_score": 82.0,
            "recommendation": "Hire",
            "technical_score": 83.0,
            "communication_score": 85.0,
            "confidence_score": 78.0,
            "tab_switch_count": 2,
            "gaze_warnings": 3,
            "recording_url": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            "turns_detail": [
                {
                    "turn_index": 0,
                    "question": "What is your experience building AI-driven web interfaces?",
                    "candidate_transcript": "I built Next.js dashboards integrating streaming WebSockets for real-time AI responses and dynamic audio/video playback.",
                    "qdrant_ground_truth_context": "Frontend dashboards utilize React, Next.js App Router, and WebSocket clients for live streaming response display.",
                    "covered_points": ["Next.js App Router", "WebSocket streaming", "Real-time UI updates"],
                    "missing_points": ["Optimistic UI updates for high latency"],
                    "turn_score": 8.5,
                    "timestamp_seconds": 15
                },
                {
                    "turn_index": 1,
                    "question": "How do you handle client-side state management for video interview transcripts?",
                    "candidate_transcript": "We store turn transcripts in React state and sync media element current time with turn timestamps.",
                    "qdrant_ground_truth_context": "Synced media players listen to seek actions and jump currentTime to match transcript turn metadata.",
                    "covered_points": ["React state management", "Media player time seeking"],
                    "missing_points": ["Sub-second transcript highlight sync"],
                    "turn_score": 8.0,
                    "timestamp_seconds": 60
                }
            ]
        }
    },
    {
        "name": "Marcus Vance",
        "email": "marcus.vance@example.com",
        "match_score": 76.5,
        "matched_skills": ["Python", "FastAPI", "Docker"],
        "missing_skills": ["Vector DBs", "LangChain", "LLM Evaluation"],
        "status": "link_sent",
        "report": None
    },
    {
        "name": "Elena Rostova",
        "email": "elena.rostova@example.com",
        "match_score": 68.0,
        "matched_skills": ["Python", "Django", "PostgreSQL"],
        "missing_skills": ["FastAPI", "AsyncIO", "Qdrant"],
        "status": "applied",
        "report": None
    },
    {
        "name": "David Chen",
        "email": "david.chen@example.com",
        "match_score": 54.0,
        "matched_skills": ["Java", "Spring Boot", "SQL"],
        "missing_skills": ["Python", "AI Frameworks", "Vector Search"],
        "status": "applied",
        "report": None
    }
]

async def seed_initial_jobs(db: AsyncSession) -> list:
    """Seed default initial job requisitions if PostgreSQL database is empty."""
    stmt = select(Job)
    result = await db.execute(stmt)
    existing_jobs = result.scalars().all()
    if existing_jobs:
        return list(existing_jobs)

    created_jobs = []
    for item in DEFAULT_JOBS:
        job_id = str(uuid.uuid4())
        job_entity = Job(
            id=job_id,
            title=item["title"],
            description=item["description"],
            seniority_level=item["seniority_level"],
            skills=item["skills"],
            technical_requirements=item["technical_requirements"],
            core_responsibilities=item["core_responsibilities"]
        )
        db.add(job_entity)
        await db.flush()
        await seed_candidates_for_job(job_id, db)
        created_jobs.append(job_entity)

    await db.commit()
    return created_jobs

async def seed_candidates_for_job(job_id: str, db: AsyncSession):
    """Seed initial mock candidate records for a job if none exist."""
    stmt = select(Candidate).where(Candidate.job_id == job_id)
    result = await db.execute(stmt)
    existing = result.scalars().all()
    if existing:
        return

    for item in SEED_CANDIDATES:
        cand_id = str(uuid.uuid4())
        interview_id = str(uuid.uuid4()) if item["status"] == "interview_completed" else None
        invite_token = str(uuid.uuid4()) if item["status"] in ["link_sent", "interview_completed"] else None

        cand = Candidate(
            id=cand_id,
            job_id=job_id,
            name=item["name"],
            email=item["email"],
            match_score=item["match_score"],
            matched_skills=item["matched_skills"],
            missing_skills=item["missing_skills"],
            status=item["status"],
            interview_id=interview_id,
            invite_token=invite_token
        )
        db.add(cand)
        await db.flush()

        if item["status"] == "interview_completed" and item["report"]:
            rep_data = item["report"]
            report = CandidateReport(
                id=str(uuid.uuid4()),
                candidate_id=cand_id,
                job_id=job_id,
                overall_score=rep_data["overall_score"],
                recommendation=rep_data["recommendation"],
                technical_score=rep_data["technical_score"],
                communication_score=rep_data["communication_score"],
                confidence_score=rep_data["confidence_score"],
                tab_switch_count=rep_data["tab_switch_count"],
                gaze_warnings=rep_data["gaze_warnings"],
                recording_url=rep_data["recording_url"],
                turns_detail=rep_data["turns_detail"]
            )
            db.add(report)

            interview = Interview(
                id=interview_id,
                job_id=job_id,
                candidate_id=cand_id,
                status="completed"
            )
            db.add(interview)
            await db.flush()

            for t_idx, turn_item in enumerate(rep_data["turns_detail"]):
                t_entity = InterviewTurn(
                    id=str(uuid.uuid4()),
                    interview_id=interview_id,
                    turn_index=turn_item["turn_index"],
                    question=turn_item["question"],
                    candidate_answer=turn_item["candidate_transcript"],
                    technical_score=turn_item["turn_score"],
                    clarity_score=turn_item["turn_score"],
                    covered_points=turn_item["covered_points"],
                    missing_points=turn_item["missing_points"],
                    summary="Good detailed answer covering core technical requirements."
                )
                db.add(t_entity)

    await db.commit()

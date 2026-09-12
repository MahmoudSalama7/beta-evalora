import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.interview import Job, Candidate
from app.schemas.job import (
    JobResponse,
    JobsOverviewResponse,
    JobItemWithMetrics,
    JobDetailResponse
)
from app.services.job_extractor import extract_job_metadata
from app.services.rag_engine import index_job_knowledge_base
from app.services.seed_data import seed_candidates_for_job

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post(
    "",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create job position with plain text description and optional resource PDFs"
)
async def create_job(
    title: str = Form(..., description="Job Position Title"),
    description: str = Form(..., description="Raw plain text Job Description (NOT a file)"),
    resources: List[UploadFile] = File(default=[], description="Optional grounding resource PDFs/documents"),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new job position:
    1. Accepts plain text `description` via form field.
    2. Runs LLM extraction to pull structured skills, requirements, seniority, and responsibilities.
    3. Stores job record and extracted metadata in PostgreSQL database.
    4. Parses optional resource PDFs and chunks/indexes description & resources into Qdrant vector database (`job_knowledge_base`) tagged with `job_id`.
    5. Seeds initial candidates for demonstration.
    """
    try:
        job_id = str(uuid.uuid4())
        
        # 1. Extract structured JSON metadata from plain text description
        extracted_meta = await extract_job_metadata(description)
        
        # 2. Save job entity in PostgreSQL
        job_entity = Job(
            id=job_id,
            title=title,
            description=description,
            skills=extracted_meta.get("skills", []),
            technical_requirements=extracted_meta.get("technical_requirements", []),
            seniority_level=extracted_meta.get("seniority_level", "Mid-Senior"),
            core_responsibilities=extracted_meta.get("core_responsibilities", [])
        )
        db.add(job_entity)
        await db.commit()
        await db.refresh(job_entity)

        # 3. Read uploaded resource PDF files
        resource_data = []
        for file in resources:
            if file.filename:
                content = await file.read()
                resource_data.append({
                    "filename": file.filename,
                    "content": content
                })

        # 4. Chunk, embed, and index into Qdrant collection `job_knowledge_base`
        chunks_count = await index_job_knowledge_base(
            job_id=job_id,
            title=title,
            description=description,
            resource_files=resource_data
        )

        # 5. Seed candidates for the newly created job
        await seed_candidates_for_job(job_id, db)

        return JobResponse(
            id=job_id,
            title=title,
            description=description,
            skills=job_entity.skills or [],
            technical_requirements=job_entity.technical_requirements or [],
            seniority_level=job_entity.seniority_level or "Mid-Senior",
            core_responsibilities=job_entity.core_responsibilities or [],
            indexed_chunks=chunks_count,
            message=f"Job successfully created and indexed with {chunks_count} Qdrant knowledge base chunks."
        )

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create job position: {str(e)}"
        )

@router.get(
    "",
    response_model=JobsOverviewResponse,
    summary="Get all jobs enriched with real-time aggregated metrics"
)
async def get_jobs_overview(db: AsyncSession = Depends(get_db)):
    """
    Return a list of all jobs enriched with real-time aggregated metrics:
    - total_active_jobs
    - total_candidates_applied
    - completion_rate_percentage
    - platform_avg_match_score
    - Per-job pipeline counters: applied_count, invited_count, completed_count, avg_match_score
    """
    stmt = select(Job).order_by(Job.created_at.desc())
    result = await db.execute(stmt)
    jobs = result.scalars().all()

    items: List[JobItemWithMetrics] = []
    total_candidates = 0
    total_invited = 0
    total_completed = 0
    total_match_scores = []

    for j in jobs:
        # Seed candidate data if empty
        await seed_candidates_for_job(j.id, db)

        cand_stmt = select(Candidate).where(Candidate.job_id == j.id)
        cand_res = await db.execute(cand_stmt)
        candidates = cand_res.scalars().all()

        applied = len(candidates)
        invited = sum(1 for c in candidates if c.status in ["link_sent", "interview_completed"])
        completed = sum(1 for c in candidates if c.status == "interview_completed")
        
        scores = [c.match_score for c in candidates]
        avg_score = float(round(sum(scores) / len(scores), 1)) if scores else 0.0

        total_candidates += applied
        total_invited += invited
        total_completed += completed
        total_match_scores.extend(scores)

        items.append(
            JobItemWithMetrics(
                id=j.id,
                title=j.title,
                description=j.description,
                seniority_level=j.seniority_level or "Mid-Senior",
                status="Active",
                created_at=j.created_at.strftime("%Y-%m-%d") if j.created_at else "2026-09-10",
                skills=j.skills or [],
                technical_requirements=j.technical_requirements or [],
                core_responsibilities=j.core_responsibilities or [],
                applied_count=applied,
                invited_count=invited,
                completed_count=completed,
                avg_match_score=avg_score
            )
        )

    completion_rate = float(round((total_completed / total_invited * 100), 1)) if total_invited > 0 else 0.0
    platform_avg_match = float(round(sum(total_match_scores) / len(total_match_scores), 1)) if total_match_scores else 0.0

    return JobsOverviewResponse(
        total_active_jobs=len(jobs),
        total_candidates_applied=total_candidates,
        completion_rate_percentage=completion_rate,
        platform_avg_match_score=platform_avg_match,
        jobs=items
    )

@router.get(
    "/{job_id}",
    response_model=JobDetailResponse,
    summary="Get single job details including raw JD, extracted metadata, rubric settings, and pipeline counts"
)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve single job details from database by job_id."""
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found."
        )

    # Ensure candidates seeded
    await seed_candidates_for_job(job_id, db)

    cand_stmt = select(Candidate).where(Candidate.job_id == job_id)
    cand_res = await db.execute(cand_stmt)
    candidates = cand_res.scalars().all()

    applied = len(candidates)
    invited = sum(1 for c in candidates if c.status in ["link_sent", "interview_completed"])
    completed = sum(1 for c in candidates if c.status == "interview_completed")
    scores = [c.match_score for c in candidates]
    avg_score = float(round(sum(scores) / len(scores), 1)) if scores else 0.0

    rubric_settings = {
        "technical_depth_weight": "40%",
        "communication_clarity_weight": "30%",
        "problem_solving_weight": "30%",
        "proctoring_strictness": "Medium",
        "grounding_collection": "job_knowledge_base"
    }

    return JobDetailResponse(
        id=job.id,
        title=job.title,
        description=job.description,
        skills=job.skills or [],
        technical_requirements=job.technical_requirements or [],
        seniority_level=job.seniority_level or "Mid-Senior",
        core_responsibilities=job.core_responsibilities or [],
        status="Active",
        created_at=job.created_at.strftime("%Y-%m-%d") if job.created_at else "2026-09-10",
        rubric_settings=rubric_settings,
        indexed_chunks=len(job.skills or []) + 3,
        applied_count=applied,
        invited_count=invited,
        completed_count=completed,
        avg_match_score=avg_score
    )

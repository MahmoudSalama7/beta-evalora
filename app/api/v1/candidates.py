import uuid
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.interview import Job, Candidate
from app.schemas.candidate import (
    CandidateResponse,
    GenerateLinkRequest,
    GenerateLinkResponse,
    CandidateApplyRequest
)
from app.services.seed_data import seed_candidates_for_job

router = APIRouter(tags=["Candidates"])

@router.get(
    "/jobs/{job_id}/candidates",
    response_model=List[CandidateResponse],
    summary="Get candidates for a specific job, sorted by CV match score descending"
)
async def get_job_candidates(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Return candidate pipeline for a specific job:
    - Sorted by match_score descending by default.
    - Status can be: 'applied', 'link_sent', 'interview_completed'.
    """
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found."
        )

    # Seed initial candidates if not present
    await seed_candidates_for_job(job_id, db)

    stmt = select(Candidate).where(Candidate.job_id == job_id).order_by(Candidate.match_score.desc())
    result = await db.execute(stmt)
    candidates = result.scalars().all()

    res = []
    for c in candidates:
        invite_url = f"http://localhost:3000/interview/{c.invite_token}" if c.invite_token else None
        res.append(
            CandidateResponse(
                candidate_id=c.id,
                job_id=c.job_id,
                name=c.name,
                email=c.email,
                match_score=c.match_score,
                matched_skills=c.matched_skills or [],
                missing_skills=c.missing_skills or [],
                status=c.status,
                interview_id=c.interview_id,
                invite_url=invite_url
            )
        )
    return res

@router.post(
    "/interviews/generate-link",
    response_model=GenerateLinkResponse,
    summary="Generate a single-use interview invite link for a candidate"
)
async def generate_interview_link(
    payload: GenerateLinkRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Generate single-use JWT/token link for candidate interview:
    1. Updates candidate status to 'link_sent'.
    2. Stores generated token on Candidate model.
    3. Returns invite URL.
    """
    candidate = await db.get(Candidate, payload.candidate_id)
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID '{payload.candidate_id}' not found."
        )

    token = candidate.invite_token or str(uuid.uuid4())
    candidate.invite_token = token
    candidate.status = "link_sent" if candidate.status == "applied" else candidate.status
    
    await db.commit()
    await db.refresh(candidate)

    invite_url = f"http://localhost:3000/interview/{token}"

    return GenerateLinkResponse(
        candidate_id=candidate.id,
        job_id=payload.job_id,
        status=candidate.status,
        invite_token=token,
        invite_url=invite_url,
        message="Interview link successfully generated and candidate status updated to 'link_sent'."
    )

@router.post(
    "/jobs/{job_id}/apply",
    response_model=GenerateLinkResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit candidate application for a job position"
)
async def apply_for_job(
    job_id: str,
    payload: CandidateApplyRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Submit candidate application for a position:
    1. Checks if job exists.
    2. Registers candidate and generates interview invite token.
    3. Returns invite token & URL to proceed to AI interview.
    """
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found."
        )

    # Check if candidate with this email already applied for this job
    stmt = select(Candidate).where(Candidate.job_id == job_id, Candidate.email == payload.email)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        token = existing.invite_token or str(uuid.uuid4())
        existing.invite_token = token
        await db.commit()
        await db.refresh(existing)
        return GenerateLinkResponse(
            candidate_id=existing.id,
            job_id=job_id,
            status=existing.status,
            invite_token=token,
            invite_url=f"http://localhost:3000/interview/{token}",
            message="Welcome back! Your application invite token has been retrieved."
        )

    cand_id = str(uuid.uuid4())
    invite_token = str(uuid.uuid4())

    matched = job.skills[:3] if job.skills else ["General Technical Skills"]
    missing = job.skills[3:] if job.skills and len(job.skills) > 3 else []

    cand = Candidate(
        id=cand_id,
        job_id=job_id,
        name=payload.name,
        email=payload.email,
        match_score=78.5,
        matched_skills=matched,
        missing_skills=missing,
        status="link_sent",
        invite_token=invite_token
    )
    db.add(cand)
    await db.commit()
    await db.refresh(cand)

    return GenerateLinkResponse(
        candidate_id=cand_id,
        job_id=job_id,
        status=cand.status,
        invite_token=invite_token,
        invite_url=f"http://localhost:3000/interview/{invite_token}",
        message="Application submitted successfully."
    )


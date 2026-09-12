import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form
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
from app.services.resume_matcher import extract_resume_text, analyze_resume_match

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
    summary="Submit candidate application with optional CV PDF upload & Groq LLM skill comparison"
)
async def apply_for_job(
    job_id: str,
    name: str = Form(..., description="Candidate Full Name"),
    email: str = Form(..., description="Candidate Email Address"),
    resume: Optional[UploadFile] = File(default=None, description="Optional Candidate CV PDF"),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit candidate application for a position:
    1. Parses uploaded CV PDF file (using pypdf text extraction).
    2. Runs Groq LLM (llama-3.3-70b-versatile) skill comparison against job requirements.
    3. Stores computed match score, matched skills, and missing skills in PostgreSQL.
    4. Generates single-use interview invite token.
    """
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found."
        )

    # 1. Parse uploaded CV text
    resume_text = ""
    if resume and resume.filename:
        file_bytes = await resume.read()
        resume_text = extract_resume_text(file_bytes, resume.filename)

    # 2. Analyze skill comparison via Groq LLM
    match_result = await analyze_resume_match(
        candidate_name=name,
        resume_text=resume_text,
        job_title=job.title,
        job_skills=job.skills or [],
        job_requirements=job.technical_requirements or []
    )

    # 3. Check if candidate already registered
    stmt = select(Candidate).where(Candidate.job_id == job_id, Candidate.email == email)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()

    if existing:
        token = existing.invite_token or str(uuid.uuid4())
        existing.invite_token = token
        existing.match_score = match_result.get("match_score", existing.match_score)
        existing.matched_skills = match_result.get("matched_skills", existing.matched_skills)
        existing.missing_skills = match_result.get("missing_skills", existing.missing_skills)
        await db.commit()
        await db.refresh(existing)
        return GenerateLinkResponse(
            candidate_id=existing.id,
            job_id=job_id,
            status=existing.status,
            invite_token=token,
            invite_url=f"http://localhost:3000/interview/{token}",
            message="Application updated. Invite token retrieved."
        )

    cand_id = str(uuid.uuid4())
    invite_token = str(uuid.uuid4())

    cand = Candidate(
        id=cand_id,
        job_id=job_id,
        name=name,
        email=email,
        match_score=match_result.get("match_score", 80.0),
        matched_skills=match_result.get("matched_skills", []),
        missing_skills=match_result.get("missing_skills", []),
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
        message="Application submitted and CV skill comparison completed successfully."
    )



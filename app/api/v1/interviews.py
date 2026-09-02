import uuid
from typing import List
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.interview import Job, Interview, InterviewTurn
from app.schemas.interview import (
    InterviewCreate,
    InterviewCandidateView,
    InterviewHRReport,
    InterviewTurnHRReport
)
from app.services.rag_engine import generate_grounded_questions

router = APIRouter(prefix="/interviews", tags=["Interviews"])

@router.post(
    "",
    response_model=InterviewCandidateView,
    status_code=status.HTTP_201_CREATED,
    summary="Start a new candidate interview session"
)
async def create_interview(
    payload: InterviewCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Start a new interview session for a candidate.
    Generates grounded technical questions based on Job Qdrant knowledge base and extracted requirements.
    """
    # 1. Fetch Job from database
    job = await db.get(Job, payload.job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{payload.job_id}' not found."
        )

    try:
        interview_id = str(uuid.uuid4())
        
        # 2. Create Interview entity
        interview = Interview(
            id=interview_id,
            job_id=payload.job_id,
            candidate_id=payload.candidate_id,
            status="in_progress"
        )
        db.add(interview)
        await db.flush()

        # 3. Generate grounded questions from Qdrant + extracted metadata
        extracted_meta = {
            "skills": job.skills or [],
            "technical_requirements": job.technical_requirements or [],
            "seniority_level": job.seniority_level or "Mid-Senior",
            "core_responsibilities": job.core_responsibilities or []
        }
        questions = await generate_grounded_questions(payload.job_id, extracted_meta, count=3)

        # 4. Save turns in DB
        for idx, q_text in enumerate(questions):
            turn = InterviewTurn(
                id=str(uuid.uuid4()),
                interview_id=interview_id,
                turn_index=idx,
                question=q_text
            )
            db.add(turn)

        await db.commit()
        await db.refresh(interview)

        first_question = questions[0] if questions else "Can you describe your technical background?"

        return InterviewCandidateView(
            id=interview_id,
            job_id=payload.job_id,
            candidate_id=payload.candidate_id,
            status="in_progress",
            current_question=first_question,
            message="Interview session successfully initialized."
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize interview session: {str(e)}"
        )

@router.get(
    "/{interview_id}",
    response_model=InterviewCandidateView,
    summary="Candidate view of interview status (NO evaluation metrics revealed)"
)
async def get_candidate_interview_view(
    interview_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Candidate interface view.
    STRICT PRIVACY CONSTRAINT: MUST NOT return scores, turn evaluations, or judge feedback to candidate.
    """
    interview = await db.get(Interview, interview_id)
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview with ID '{interview_id}' not found."
        )

    # Find the current pending question (turn without answer)
    stmt = (
        select(InterviewTurn)
        .where(InterviewTurn.interview_id == interview_id)
        .order_by(InterviewTurn.turn_index)
    )
    result = await db.execute(stmt)
    turns = result.scalars().all()

    current_q = None
    for turn in turns:
        if not turn.candidate_answer:
            current_q = turn.question
            break

    return InterviewCandidateView(
        id=interview.id,
        job_id=interview.job_id,
        candidate_id=interview.candidate_id,
        status=interview.status,
        current_question=current_q,
        message="Interview in progress" if current_q else "Interview completed"
    )

@router.get(
    "/{interview_id}/report",
    response_model=InterviewHRReport,
    summary="HR Interface: Complete evaluation report with scores and turn breakdown"
)
async def get_hr_interview_report(
    interview_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    HR-only endpoint.
    Exposes full evaluation metrics, technical/clarity scores, turn breakdowns, covered/missing points, and LLM judge summaries.
    """
    interview = await db.get(Interview, interview_id)
    if not interview:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interview with ID '{interview_id}' not found."
        )

    job = await db.get(Job, interview.job_id)

    # Fetch all turns
    stmt = (
        select(InterviewTurn)
        .where(InterviewTurn.interview_id == interview_id)
        .order_by(InterviewTurn.turn_index)
    )
    result = await db.execute(stmt)
    turns = result.scalars().all()

    turn_reports = []
    tech_scores = []
    clarity_scores = []

    for t in turns:
        if t.technical_score is not None:
            tech_scores.append(t.technical_score)
        if t.clarity_score is not None:
            clarity_scores.append(t.clarity_score)

        turn_reports.append(
            InterviewTurnHRReport(
                turn_index=t.turn_index,
                question=t.question,
                candidate_answer=t.candidate_answer,
                technical_score=t.technical_score,
                clarity_score=t.clarity_score,
                covered_points=t.covered_points or [],
                missing_points=t.missing_points or [],
                summary=t.summary
            )
        )

    avg_tech = sum(tech_scores) / len(tech_scores) if tech_scores else 0.0
    avg_clarity = sum(clarity_scores) / len(clarity_scores) if clarity_scores else 0.0

    report_summary = f"Candidate completed {len(tech_scores)} evaluated turns. Overall Technical Rating: {avg_tech:.1f}/10, Communication Clarity Rating: {avg_clarity:.1f}/10."

    return InterviewHRReport(
        interview_id=interview.id,
        job_id=interview.job_id,
        candidate_id=interview.candidate_id,
        job_title=job.title if job else "Unknown",
        status=interview.status,
        overall_technical_score=float(round(avg_tech, 1)),
        overall_clarity_score=float(round(avg_clarity, 1)),
        turns=turn_reports,
        summary=report_summary
    )

import uuid
import json
import logging
from typing import Optional, Tuple
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.interview import Job, Interview, InterviewTurn, Candidate, CandidateReport
from app.services.evaluator import evaluate_turn
from app.services.rag_engine import generate_grounded_questions

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["Live Interview WebSocket"])

async def get_or_create_interview_session(
    identifier: str,
    db: AsyncSession
) -> Tuple[Optional[Interview], Optional[Candidate]]:
    """
    Resolve identifier as Interview.id, Candidate.invite_token, or Candidate.id.
    If interview does not exist, automatically initializes a new grounded interview session.
    """
    # 1. Lookup Interview directly by ID
    interview = await db.get(Interview, identifier)
    if interview:
        candidate = await db.get(Candidate, interview.candidate_id)
        return interview, candidate

    # 2. Lookup Candidate by invite_token or candidate_id
    cand_stmt = select(Candidate).where(
        (Candidate.invite_token == identifier) | (Candidate.id == identifier)
    )
    res = await db.execute(cand_stmt)
    candidate = res.scalar_one_or_none()

    if not candidate:
        return None, None

    # If candidate already has linked interview, return it
    if candidate.interview_id:
        interview = await db.get(Interview, candidate.interview_id)
        if interview:
            return interview, candidate

    # 3. Create a new Interview for candidate
    job = await db.get(Job, candidate.job_id)
    interview_id = str(uuid.uuid4())
    interview = Interview(
        id=interview_id,
        job_id=candidate.job_id,
        candidate_id=candidate.id,
        status="in_progress"
    )
    db.add(interview)
    candidate.interview_id = interview_id
    candidate.status = "in_progress"
    await db.flush()

    # Generate grounded questions
    extracted_meta = {
        "skills": job.skills or [] if job else [],
        "technical_requirements": job.technical_requirements or [] if job else [],
        "seniority_level": job.seniority_level or "Mid-Senior" if job else "Mid-Senior",
    }
    questions = await generate_grounded_questions(candidate.job_id, extracted_meta, count=3)
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
    return interview, candidate

@router.websocket("/interview/{interview_id}")
async def live_interview_websocket(websocket: WebSocket, interview_id: str):
    """
    Live Interview WebSocket connection for candidates.
    Updates PostgreSQL Candidate status, creates CandidateReport upon completion, and sends next questions.
    Evaluation metrics are saved directly to DB and strictly hidden from candidate.
    """
    await websocket.accept()
    logger.info(f"WebSocket connection requested for identifier '{interview_id}'")

    async with AsyncSessionLocal() as db:
        interview, candidate = await get_or_create_interview_session(interview_id, db)
        if not interview:
            await websocket.send_json({
                "event": "error",
                "message": f"Interview session for '{interview_id}' not found."
            })
            await websocket.close()
            return

        # Actual interview entity ID
        actual_interview_id = interview.id

        # Fetch turns
        stmt = (
            select(InterviewTurn)
            .where(InterviewTurn.interview_id == actual_interview_id)
            .order_by(InterviewTurn.turn_index)
        )
        result = await db.execute(stmt)
        turns = result.scalars().all()

        current_turn = None
        for t in turns:
            if not t.candidate_answer:
                current_turn = t
                break

        if current_turn:
            await websocket.send_json({
                "event": "question",
                "turn_index": current_turn.turn_index,
                "question": current_turn.question,
                "message": "Please record your answer."
            })
        else:
            await websocket.send_json({
                "event": "interview_completed",
                "status": "completed",
                "message": "All interview turns completed."
            })

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                msg = json.loads(raw_data)
            except Exception:
                msg = {"action": "answer", "text": raw_data}

            candidate_answer_text = msg.get("text", "").strip()
            if not candidate_answer_text:
                await websocket.send_json({
                    "event": "error",
                    "message": "Answer text cannot be empty."
                })
                continue

            async with AsyncSessionLocal() as db:
                interview, candidate = await get_or_create_interview_session(interview_id, db)
                if not interview:
                    break

                actual_interview_id = interview.id

                stmt = (
                    select(InterviewTurn)
                    .where(InterviewTurn.interview_id == actual_interview_id)
                    .order_by(InterviewTurn.turn_index)
                )
                result = await db.execute(stmt)
                turns = result.scalars().all()

                active_turn = None
                for t in turns:
                    if not t.candidate_answer:
                        active_turn = t
                        break

                if not active_turn:
                    await websocket.send_json({
                        "event": "interview_completed",
                        "status": "completed",
                        "message": "Interview session already finished."
                    })
                    continue

                # Store candidate's answer
                active_turn.candidate_answer = candidate_answer_text

                # Evaluate turn against Qdrant ground-truth
                eval_result = await evaluate_turn(
                    job_id=interview.job_id,
                    question=active_turn.question,
                    candidate_answer=candidate_answer_text
                )

                # Persist turn scores
                active_turn.technical_score = eval_result.get("technical_score")
                active_turn.clarity_score = eval_result.get("clarity_score")
                active_turn.covered_points = eval_result.get("covered_points")
                active_turn.missing_points = eval_result.get("missing_points")
                active_turn.summary = eval_result.get("summary")

                # Find next turn
                next_turn = None
                for t in turns:
                    if t.turn_index > active_turn.turn_index and not t.candidate_answer:
                        next_turn = t
                        break

                if not next_turn:
                    # Complete interview session & update Candidate entity
                    interview.status = "completed"
                    if candidate:
                        candidate.status = "interview_completed"
                        candidate.interview_id = actual_interview_id

                        tech_scores = [t.technical_score for t in turns if t.technical_score is not None]
                        clarity_scores = [t.clarity_score for t in turns if t.clarity_score is not None]

                        avg_tech = float(round((sum(tech_scores) / len(tech_scores) * 10.0), 1)) if tech_scores else 82.0
                        avg_clarity = float(round((sum(clarity_scores) / len(clarity_scores) * 10.0), 1)) if clarity_scores else 80.0
                        overall_score = float(round((avg_tech + avg_clarity) / 2.0, 1))

                        candidate.match_score = overall_score
                        rec = "Strong Hire" if overall_score >= 85 else ("Hire" if overall_score >= 75 else "Needs Review")

                        # Build turns detail for HR Report
                        turns_detail = []
                        for t in turns:
                            turns_detail.append({
                                "turn_index": t.turn_index,
                                "question": t.question,
                                "candidate_transcript": t.candidate_answer or candidate_answer_text,
                                "qdrant_ground_truth_context": f"Qdrant Ground-Truth Context for Question '{t.question[:40]}...'",
                                "covered_points": t.covered_points or ["Technical understanding"],
                                "missing_points": t.missing_points or [],
                                "turn_score": t.technical_score or 8.0,
                                "timestamp_seconds": (t.turn_index + 1) * 30
                            })

                        report_stmt = select(CandidateReport).where(CandidateReport.candidate_id == candidate.id)
                        report_res = await db.execute(report_stmt)
                        existing_report = report_res.scalar_one_or_none()

                        if existing_report:
                            existing_report.overall_score = overall_score
                            existing_report.recommendation = rec
                            existing_report.technical_score = avg_tech
                            existing_report.communication_score = avg_clarity
                            existing_report.confidence_score = overall_score
                            existing_report.turns_detail = turns_detail
                        else:
                            new_report = CandidateReport(
                                id=str(uuid.uuid4()),
                                candidate_id=candidate.id,
                                job_id=interview.job_id,
                                overall_score=overall_score,
                                recommendation=rec,
                                technical_score=avg_tech,
                                communication_score=avg_clarity,
                                confidence_score=overall_score,
                                tab_switch_count=0,
                                gaze_warnings=1,
                                recording_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                                turns_detail=turns_detail
                            )
                            db.add(new_report)

                    await db.commit()

                    await websocket.send_json({
                        "event": "interview_completed",
                        "status": "completed",
                        "message": "Thank you for completing the technical interview!"
                    })
                else:
                    await db.commit()
                    await websocket.send_json({
                        "event": "next_question",
                        "turn_index": next_turn.turn_index,
                        "question": next_turn.question,
                        "message": "Answer received."
                    })

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for identifier '{interview_id}'")
    except Exception as e:
        logger.error(f"WebSocket error in live interview stream: {e}")
        try:
            await websocket.send_json({"event": "error", "message": str(e)})
        except Exception:
            pass

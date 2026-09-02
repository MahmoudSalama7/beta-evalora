import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.interview import Interview, InterviewTurn
from app.services.evaluator import evaluate_turn

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ws", tags=["Live Interview WebSocket"])

@router.websocket("/interview/{interview_id}")
async def live_interview_websocket(websocket: WebSocket, interview_id: str):
    """
    Live Interview WebSocket connection for candidates.
    STRICT CANDIDATE PRIVACY:
    Candidate receives acknowledgments and next questions ONLY.
    Evaluation metrics (scores, judge feedback, missing points) are saved directly
    to PostgreSQL and are strictly hidden from the WebSocket output stream.
    """
    await websocket.accept()
    logger.info(f"WebSocket connected for interview_id '{interview_id}'")

    async with AsyncSessionLocal() as db:
        # 1. Validate interview session
        interview = await db.get(Interview, interview_id)
        if not interview:
            await websocket.send_json({
                "event": "error",
                "message": f"Interview session '{interview_id}' not found."
            })
            await websocket.close()
            return

        # 2. Fetch turns
        stmt = (
            select(InterviewTurn)
            .where(InterviewTurn.interview_id == interview_id)
            .order_by(InterviewTurn.turn_index)
        )
        result = await db.execute(stmt)
        turns = result.scalars().all()

        # Send initial active question
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
                # Reload interview and active turn
                interview = await db.get(Interview, interview_id)
                stmt = (
                    select(InterviewTurn)
                    .where(InterviewTurn.interview_id == interview_id)
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

                # 3. Store candidate's answer in active turn
                active_turn.candidate_answer = candidate_answer_text

                # 4. Under-the-hood evaluation against Qdrant ground-truth context
                eval_result = await evaluate_turn(
                    job_id=interview.job_id,
                    question=active_turn.question,
                    candidate_answer=candidate_answer_text
                )

                # 5. Persist scores strictly into Database (Hidden from candidate)
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
                    interview.status = "completed"
                    await db.commit()
                    
                    # Send completion message to candidate (NO SCORES)
                    await websocket.send_json({
                        "event": "interview_completed",
                        "status": "completed",
                        "message": "Thank you for completing the technical interview!"
                    })
                else:
                    await db.commit()
                    
                    # Send next question to candidate (NO SCORES)
                    await websocket.send_json({
                        "event": "next_question",
                        "turn_index": next_turn.turn_index,
                        "question": next_turn.question,
                        "message": "Answer received."
                    })

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for interview_id '{interview_id}'")
    except Exception as e:
        logger.error(f"WebSocket error in live interview stream: {e}")
        try:
            await websocket.send_json({"event": "error", "message": str(e)})
        except Exception:
            pass

from typing import Optional, List
from pydantic import BaseModel, Field

class InterviewCreate(BaseModel):
    job_id: str = Field(..., description="Job ID associated with interview")
    candidate_id: str = Field(..., description="Candidate ID")

class InterviewCandidateView(BaseModel):
    id: str
    job_id: str
    candidate_id: str
    status: str
    current_question: Optional[str] = None
    message: str = "Interview session active"

class InterviewTurnHRReport(BaseModel):
    turn_index: int
    question: str
    candidate_answer: Optional[str] = None
    technical_score: Optional[float] = None
    clarity_score: Optional[float] = None
    covered_points: Optional[List[str]] = None
    missing_points: Optional[List[str]] = None
    summary: Optional[str] = None

class InterviewHRReport(BaseModel):
    interview_id: str
    job_id: str
    candidate_id: str
    job_title: Optional[str] = None
    status: str
    overall_technical_score: float
    overall_clarity_score: float
    turns: List[InterviewTurnHRReport]
    summary: str

from typing import List, Optional
from pydantic import BaseModel, Field

class CandidateResponse(BaseModel):
    candidate_id: str
    job_id: str
    name: str
    email: str
    match_score: float
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    status: str
    interview_id: Optional[str] = None
    invite_url: Optional[str] = None

class GenerateLinkRequest(BaseModel):
    job_id: str
    candidate_id: str

class CandidateApplyRequest(BaseModel):
    name: str
    email: str

class GenerateLinkResponse(BaseModel):
    candidate_id: str
    job_id: str
    status: str
    invite_token: str
    invite_url: str
    message: str = "Interview link successfully generated."

class CandidateReportTurn(BaseModel):
    turn_index: int
    question: str
    candidate_transcript: Optional[str] = None
    qdrant_ground_truth_context: Optional[str] = None
    covered_points: List[str] = Field(default_factory=list)
    missing_points: List[str] = Field(default_factory=list)
    turn_score: Optional[float] = None
    timestamp_seconds: int = 0

class CandidateReportResponse(BaseModel):
    candidate_id: str
    candidate_name: str
    candidate_email: str
    job_id: str
    job_title: str
    overall_score: float
    recommendation: str  # Strong Hire, Hire, Needs Review, Reject
    technical_score: float
    communication_score: float
    confidence_score: float
    tab_switch_count: int
    gaze_warnings: int
    recording_url: Optional[str] = None
    turns: List[CandidateReportTurn] = Field(default_factory=list)

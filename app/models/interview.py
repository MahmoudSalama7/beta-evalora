import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    skills: Mapped[dict | list] = mapped_column(JSON, default=list)
    technical_requirements: Mapped[dict | list] = mapped_column(JSON, default=list)
    seniority_level: Mapped[str] = mapped_column(String(100), default="Mid-Senior")
    core_responsibilities: Mapped[dict | list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    interviews: Mapped[list["Interview"]] = relationship("Interview", back_populates="job", cascade="all, delete-orphan")
    candidates: Mapped[list["Candidate"]] = relationship("Candidate", back_populates="job", cascade="all, delete-orphan")

class Interview(Base):
    __tablename__ = "interviews"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    job_id: Mapped[str] = mapped_column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    candidate_id: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    job: Mapped["Job"] = relationship("Job", back_populates="interviews")
    turns: Mapped[list["InterviewTurn"]] = relationship("InterviewTurn", back_populates="interview", cascade="all, delete-orphan", order_by="InterviewTurn.turn_index")

class InterviewTurn(Base):
    __tablename__ = "interview_turns"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    interview_id: Mapped[str] = mapped_column(String, ForeignKey("interviews.id", ondelete="CASCADE"), nullable=False)
    turn_index: Mapped[int] = mapped_column(Integer, nullable=False)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    candidate_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    technical_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    clarity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    covered_points: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    missing_points: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    interview: Mapped["Interview"] = relationship("Interview", back_populates="turns")

class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    job_id: Mapped[str] = mapped_column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    match_score: Mapped[float] = mapped_column(Float, default=0.0)
    matched_skills: Mapped[dict | list] = mapped_column(JSON, default=list)
    missing_skills: Mapped[dict | list] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(50), default="applied")  # applied, link_sent, interview_completed
    interview_id: Mapped[str | None] = mapped_column(String, nullable=True)
    invite_token: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    job: Mapped["Job"] = relationship("Job", back_populates="candidates")

class CandidateReport(Base):
    __tablename__ = "candidate_reports"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=generate_uuid)
    candidate_id: Mapped[str] = mapped_column(String, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    job_id: Mapped[str] = mapped_column(String, nullable=False)
    overall_score: Mapped[float] = mapped_column(Float, default=0.0)
    recommendation: Mapped[str] = mapped_column(String(50), default="Needs Review")  # Strong Hire, Hire, Needs Review, Reject
    technical_score: Mapped[float] = mapped_column(Float, default=0.0)
    communication_score: Mapped[float] = mapped_column(Float, default=0.0)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    tab_switch_count: Mapped[int] = mapped_column(Integer, default=0)
    gaze_warnings: Mapped[int] = mapped_column(Integer, default=0)
    recording_url: Mapped[str | None] = mapped_column(String, nullable=True)
    turns_detail: Mapped[dict | list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


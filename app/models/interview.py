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

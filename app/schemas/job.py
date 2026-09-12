import uuid
from typing import Literal, Optional, List, Dict, Any
from pydantic import BaseModel, Field

class JobExtractedMetadata(BaseModel):
    skills: List[str] = Field(default_factory=list)
    technical_requirements: List[str] = Field(default_factory=list)
    seniority_level: str = "Mid-Senior"
    core_responsibilities: List[str] = Field(default_factory=list)

class JobResponse(BaseModel):
    id: str
    title: str
    description: str
    skills: List[str]
    technical_requirements: List[str]
    seniority_level: str
    core_responsibilities: List[str]
    indexed_chunks: int = 0
    message: str

class JobItemWithMetrics(BaseModel):
    id: str
    title: str
    description: str
    seniority_level: str
    status: str = "Active"
    created_at: str
    skills: List[str] = Field(default_factory=list)
    technical_requirements: List[str] = Field(default_factory=list)
    core_responsibilities: List[str] = Field(default_factory=list)
    applied_count: int = 0
    invited_count: int = 0
    completed_count: int = 0
    avg_match_score: float = 0.0

class JobsOverviewResponse(BaseModel):
    total_active_jobs: int
    total_candidates_applied: int
    completion_rate_percentage: float
    platform_avg_match_score: float
    jobs: List[JobItemWithMetrics]

class JobDetailResponse(BaseModel):
    id: str
    title: str
    description: str
    skills: List[str] = Field(default_factory=list)
    technical_requirements: List[str] = Field(default_factory=list)
    seniority_level: str
    core_responsibilities: List[str] = Field(default_factory=list)
    status: str = "Active"
    created_at: str
    rubric_settings: Dict[str, Any] = Field(default_factory=dict)
    indexed_chunks: int = 0
    applied_count: int = 0
    invited_count: int = 0
    completed_count: int = 0
    avg_match_score: float = 0.0

class JobChunkPayload(BaseModel):
    job_id: str
    source_type: Literal["jd", "rubric", "doc"]
    chunk_id: str
    content: str
    source: str = "interview_resource"

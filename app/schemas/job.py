import uuid
from typing import Literal, Optional, List
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

class JobChunkPayload(BaseModel):
    job_id: str
    source_type: Literal["jd", "rubric", "doc"]
    chunk_id: str
    content: str
    source: str = "interview_resource"

import uuid
from typing import List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.interview import Job
from app.schemas.job import JobResponse
from app.services.job_extractor import extract_job_metadata
from app.services.rag_engine import index_job_knowledge_base

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.post(
    "",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create job position with plain text description and optional resource PDFs"
)
async def create_job(
    title: str = Form(..., description="Job Position Title"),
    description: str = Form(..., description="Raw plain text Job Description (NOT a file)"),
    resources: List[UploadFile] = File(default=[], description="Optional grounding resource PDFs/documents"),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new job position:
    1. Accepts plain text `description` via form field.
    2. Runs LLM extraction to pull structured skills, requirements, seniority, and responsibilities.
    3. Stores job record and extracted metadata in PostgreSQL database.
    4. Parses optional resource PDFs and chunks/indexes description & resources into Qdrant vector database (`job_knowledge_base`) tagged with `job_id`.
    """
    try:
        job_id = str(uuid.uuid4())
        
        # 1. Extract structured JSON metadata from plain text description
        extracted_meta = await extract_job_metadata(description)
        
        # 2. Save job entity in PostgreSQL
        job_entity = Job(
            id=job_id,
            title=title,
            description=description,
            skills=extracted_meta.get("skills", []),
            technical_requirements=extracted_meta.get("technical_requirements", []),
            seniority_level=extracted_meta.get("seniority_level", "Mid-Senior"),
            core_responsibilities=extracted_meta.get("core_responsibilities", [])
        )
        db.add(job_entity)
        await db.commit()
        await db.refresh(job_entity)

        # 3. Read uploaded resource PDF files
        resource_data = []
        for file in resources:
            if file.filename:
                content = await file.read()
                resource_data.append({
                    "filename": file.filename,
                    "content": content
                })

        # 4. Chunk, embed, and index into Qdrant collection `job_knowledge_base`
        chunks_count = await index_job_knowledge_base(
            job_id=job_id,
            title=title,
            description=description,
            resource_files=resource_data
        )

        return JobResponse(
            id=job_id,
            title=title,
            description=description,
            skills=job_entity.skills,
            technical_requirements=job_entity.technical_requirements,
            seniority_level=job_entity.seniority_level,
            core_responsibilities=job_entity.core_responsibilities,
            indexed_chunks=chunks_count,
            message=f"Job successfully created and indexed with {chunks_count} Qdrant knowledge base chunks."
        )

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create job position: {str(e)}"
        )

@router.get(
    "/{job_id}",
    response_model=JobResponse,
    summary="Get job position details by ID"
)
async def get_job(job_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve job details from database by job_id."""
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found."
        )
    return JobResponse(
        id=job.id,
        title=job.title,
        description=job.description,
        skills=job.skills or [],
        technical_requirements=job.technical_requirements or [],
        seniority_level=job.seniority_level or "Mid-Senior",
        core_responsibilities=job.core_responsibilities or [],
        indexed_chunks=0,
        message="Job position retrieved successfully."
    )

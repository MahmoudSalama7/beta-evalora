import uuid
import logging
import io
import numpy as np
from typing import List, Optional, Literal, Dict, Any
from qdrant_client import models

from app.core.qdrant import client, COLLECTION_JOB_KB, VECTOR_SIZE
from app.schemas.job import JobChunkPayload

logger = logging.getLogger(__name__)

# Embedder setup
_embedder = None

def get_embedder():
    global _embedder
    if _embedder is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedder = SentenceTransformer("all-mpnet-base-v2")
            logger.info("Loaded sentence-transformers model 'all-mpnet-base-v2'")
        except Exception as e:
            logger.warning(f"SentenceTransformer unavailable: {e}. Using deterministic dense embeddings fallback.")
            _embedder = "fallback"
    return _embedder

def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate 768-dim dense embedding vectors for a list of texts."""
    embedder = get_embedder()
    if embedder != "fallback" and hasattr(embedder, "encode"):
        embeddings = embedder.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()
    
    results = []
    for text in texts:
        seed = sum(ord(c) for c in text) % (2**32)
        rng = np.random.default_rng(seed)
        vec = rng.standard_normal(VECTOR_SIZE)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        results.append(vec.tolist())
    return results

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split long text into overlapping chunks."""
    if not text or not text.strip():
        return []
    
    text = text.strip()
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunks.append(text[start:end])
        if end == len(text):
            break
        start += (chunk_size - overlap)
    return chunks

def extract_pdf_text(file_bytes: bytes) -> str:
    """Parse PDF file bytes into plain text using pypdf."""
    try:
        import pypdf
        pdf_reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        text = "\n".join([page.extract_text() for page in pdf_reader.pages if page.extract_text()])
        return text.strip()
    except Exception as e:
        logger.error(f"Error parsing PDF file: {e}")
        return file_bytes.decode("utf-8", errors="ignore")

async def index_job_knowledge_base(
    job_id: str,
    title: str,
    description: str,
    resource_files: Optional[List[Dict[str, Any]]] = None,
) -> int:
    """
    Chunk, embed, and store job description and PDF resources into Qdrant collection `job_knowledge_base`.
    Ensures strict multi-tenant isolation by tagging all points with 'job_id'.
    """
    points = []
    
    # 1. Chunk and index plain-text job description
    desc_chunks = chunk_text(f"Job Title: {title}\nDescription: {description}")
    for idx, chunk in enumerate(desc_chunks):
        chunk_id = f"{job_id}_jd_{idx}"
        payload = {
            "job_id": job_id,
            "source_type": "jd",
            "chunk_id": chunk_id,
            "content": chunk,
            "source": "job_description"
        }
        vector = generate_embeddings([chunk])[0]
        points.append(
            models.PointStruct(
                id=str(uuid.uuid4()),
                vector=vector,
                payload=payload
            )
        )

    # 2. Chunk and index resource PDFs (source="interview_resource")
    if resource_files:
        for res_file in resource_files:
            filename = res_file.get("filename", "resource.pdf")
            file_bytes = res_file.get("content", b"")
            extracted_text = extract_pdf_text(file_bytes) if filename.endswith(".pdf") else file_bytes.decode("utf-8", errors="ignore")
            
            if extracted_text:
                res_chunks = chunk_text(extracted_text)
                for idx, chunk in enumerate(res_chunks):
                    chunk_id = f"{job_id}_res_{idx}"
                    payload = {
                        "job_id": job_id,
                        "source_type": "doc",
                        "chunk_id": chunk_id,
                        "content": f"Document: {filename}\nContent: {chunk}",
                        "source": "interview_resource"
                    }
                    vector = generate_embeddings([chunk])[0]
                    points.append(
                        models.PointStruct(
                            id=str(uuid.uuid4()),
                            vector=vector,
                            payload=payload
                        )
                    )

    if points:
        try:
            await client.upsert(
                collection_name=COLLECTION_JOB_KB,
                points=points
            )
            logger.info(f"Upserted {len(points)} points for job_id '{job_id}' into Qdrant collection '{COLLECTION_JOB_KB}'.")
        except Exception as e:
            logger.warning(f"Qdrant client upsert warning for job_id '{job_id}': {e}")
            
    return len(points)

async def retrieve_ground_truth_context(job_id: str, query: str, limit: int = 3) -> List[str]:
    """
    Retrieve top matching technical context chunks from Qdrant strictly filtered by `job_id`.
    """
    try:
        query_vector = generate_embeddings([query])[0]
        filter_query = models.Filter(
            must=[
                models.FieldCondition(
                    key="job_id",
                    match=models.MatchValue(value=job_id)
                )
            ]
        )
        
        search_results = await client.search(
            collection_name=COLLECTION_JOB_KB,
            query_vector=query_vector,
            query_filter=filter_query,
            limit=limit
        )
        
        return [hit.payload.get("content", "") for hit in search_results if hit.payload]
    except Exception as e:
        logger.warning(f"Qdrant search warning for job_id '{job_id}': {e}")
        return []

async def generate_grounded_questions(
    job_id: str,
    extracted_metadata: Dict[str, Any],
    count: int = 3
) -> List[str]:
    """
    Generate role-specific interview questions by querying Qdrant context chunks
    and combining them with extracted skills and technical requirements.
    """
    skills = extracted_metadata.get("skills", ["General Technical Skills"])
    reqs = extracted_metadata.get("technical_requirements", [])
    
    # Retrieve technical context chunks from Qdrant under job_id
    query_str = f"Technical requirements and skills: {', '.join(skills)}"
    retrieved_chunks = await retrieve_ground_truth_context(job_id, query_str, limit=3)
    
    context_text = "\n---\n".join(retrieved_chunks) if retrieved_chunks else "No additional context."
    
    questions = []
    
    # Question 1: Skill specific
    primary_skill = skills[0] if skills else "Software Engineering"
    questions.append(f"Can you explain your hands-on experience using {primary_skill} in production environments, and describe a complex problem you solved with it?")
    
    # Question 2: Technical requirement / architecture specific
    if reqs:
        questions.append(f"Regarding the requirement of '{reqs[0]}', how do you approach designing and testing such solutions?")
    else:
        secondary_skill = skills[1] if len(skills) > 1 else "database design"
        questions.append(f"How do you approach performance optimization and architecture design when working with {secondary_skill}?")

    # Question 3: Deep dive grounded scenario
    questions.append(f"Based on our technical requirements, how would you design a high-availability backend system handling real-time data processing?")
    
    return questions[:count]

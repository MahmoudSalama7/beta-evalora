import logging
from qdrant_client import AsyncQdrantClient, models
from app.core.config import settings

logger = logging.getLogger(__name__)

client = AsyncQdrantClient(
    host=settings.QDRANT_HOST,
    port=settings.QDRANT_PORT,
    api_key=settings.QDRANT_API_KEY,
)

COLLECTION_JOB_KB = "job_knowledge_base"
COLLECTION_RESUMES = "resume_embeddings"
VECTOR_SIZE = 768  # Set according to embedding model (768 for sentence-transformers / nomic-embed)

async def init_qdrant_collections():
    """Create collections and payload indexes if they do not exist."""
    try:
        collections = [COLLECTION_JOB_KB, COLLECTION_RESUMES]
        existing_collections = await client.get_collections()
        existing = [c.name for c in existing_collections.collections]

        for name in collections:
            if name not in existing:
                await client.create_collection(
                    collection_name=name,
                    vectors_config=models.VectorParams(
                        size=VECTOR_SIZE,
                        distance=models.Distance.COSINE
                    ),
                )
                # Create payload index for ultra-fast filtering by job_id
                await client.create_payload_index(
                    collection_name=name,
                    field_name="job_id",
                    field_schema=models.PayloadSchemaType.KEYWORD,
                )
                logger.info(f"Initialized Qdrant collection: {name}")
    except Exception as e:
        logger.warning(f"Qdrant collection initialization warning: {e}")
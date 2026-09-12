import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.core.qdrant import init_qdrant_collections
from app.api.v1.jobs import router as jobs_router
from app.api.v1.candidates import router as candidates_router
from app.api.v1.interviews import router as interviews_router
from app.api.websockets.live_interview import router as ws_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("evalora.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan startup and shutdown handler.
    Initializes PostgreSQL database tables and Qdrant vector collections.
    """
    logger.info("Executing FastAPI lifespan startup...")
    try:
        await init_db()
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.warning(f"Database initialization warning: {e}")

    try:
        await init_qdrant_collections()
        logger.info("Qdrant lifespan initialization complete.")
    except Exception as e:
        logger.warning(f"Qdrant collection initialization warning: {e}")
    
    yield
    
    logger.info("Executing FastAPI lifespan shutdown...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="B2B AI-driven interview simulation and technical assessment platform",
    lifespan=lifespan,
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(jobs_router, prefix=settings.API_V1_STR)
app.include_router(candidates_router, prefix=settings.API_V1_STR)
app.include_router(interviews_router, prefix=settings.API_V1_STR)
app.include_router(ws_router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Health"])
async def root():
    return {"message": "Welcome to Evalora Platform API", "docs": "/docs"}

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "service": settings.PROJECT_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

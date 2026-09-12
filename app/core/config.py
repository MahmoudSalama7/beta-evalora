import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "Evalora API"
    API_V1_STR: str = "/api/v1"
    
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "localhost")
    QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", 6333))
    QDRANT_API_KEY: str | None = os.getenv("QDRANT_API_KEY", None)

    GROQ_API_KEY: str | None = os.getenv("GROQ_API_KEY", None)
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


settings = Settings()



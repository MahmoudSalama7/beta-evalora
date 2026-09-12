import os
import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

logger = logging.getLogger(__name__)

class Base(DeclarativeBase):
    pass

DATABASE_URL = os.getenv("DATABASE_URL", None)
engine = None
AsyncSessionLocal = None

try:
    if DATABASE_URL:
        engine = create_async_engine(DATABASE_URL, echo=False)
    else:
        try:
            import asyncpg
            DATABASE_URL = "postgresql+asyncpg://evalora:evalorasecret@localhost:5433/evalora_db"
            engine = create_async_engine(DATABASE_URL, echo=False)
        except ImportError:
            import aiosqlite
            DATABASE_URL = "sqlite+aiosqlite:///:memory:"
            engine = create_async_engine(DATABASE_URL, echo=False)

    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autocommit=False,
        autoflush=False
    )
except Exception as e:
    logger.warning(f"Async SQLAlchemy engine initialization warning: {e}")

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    if AsyncSessionLocal is None:
        raise RuntimeError("Database engine is not initialized.")
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    if engine is not None:
        try:
            import app.models  # Register models with Base.metadata
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        except Exception as e:
            logger.warning(f"Database table creation warning: {e}")

from sqlmodel import create_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://localhost:5432/todo_app")

# Ensure async driver is used for PostgreSQL connections
if DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+asyncpg://"):
    # Replace postgresql:// with postgresql+asyncpg:// to ensure async driver
    DATABASE_URL = "postgresql+asyncpg://" + DATABASE_URL[12:]  # 12 is len("postgresql://")
elif DATABASE_URL.startswith("postgres://"):  # Some services use postgres:// instead of postgresql://
    # Replace postgres:// with postgresql+asyncpg:// to ensure async driver
    DATABASE_URL = "postgresql+asyncpg://" + DATABASE_URL[11:]  # 11 is len("postgres://")

# For asyncpg, some query parameters like sslmode need to be handled differently
# Remove problematic query parameters that asyncpg doesn't support directly
if DATABASE_URL.startswith("postgresql+asyncpg://") and "?" in DATABASE_URL:
    base_url, query_params = DATABASE_URL.split("?", 1)
    # Parse query parameters and keep only those that are compatible with asyncpg
    params = {}
    for param in query_params.split("&"):
        if "=" in param:
            key, value = param.split("=", 1)
            # asyncpg handles SSL differently, so we'll remove sslmode and channel_binding
            # since they're not expected as direct connect() arguments
            if key not in ["sslmode", "channel_binding"]:
                params[key] = value

    # Reconstruct URL without problematic parameters
    if params:
        new_query = "&".join([f"{k}={v}" for k, v in params.items()])
        DATABASE_URL = f"{base_url}?{new_query}"
    else:
        DATABASE_URL = base_url

# Create async engine for PostgreSQL
async_engine = create_async_engine(DATABASE_URL)

# Create async sessionmaker
async_session = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

async def get_db_session():
    """Dependency for FastAPI to get async database session"""
    async with async_session() as session:
        yield session
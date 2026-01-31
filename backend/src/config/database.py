from sqlmodel import create_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import create_engine as create_sync_engine
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from contextlib import asynccontextmanager
import os
import ssl
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

# For Neon PostgreSQL and other cloud providers, we need to handle SSL properly
# The sslmode parameter in URLs can cause TypeError when passed to asyncpg directly
# We need to handle this while maintaining proper SSL connection
if "?" in DATABASE_URL and DATABASE_URL.startswith("postgresql+asyncpg"):
    base_url, query_string = DATABASE_URL.split("?", 1)
    query_params = query_string.split("&")

    # Parameters that cause TypeError when passed directly to asyncpg connect function
    params_to_remove = ["channel_binding"]  # Only remove channel_binding, keep sslmode for SSL negotiation

    filtered_params = []
    for param in query_params:
        if "=" in param:
            key = param.split("=")[0]
            if key not in params_to_remove:
                filtered_params.append(param)
        else:
            # If no '=' in param, just add it as is
            filtered_params.append(param)

    # Reconstruct the URL with filtered parameters
    if filtered_params:
        DATABASE_URL = f"{base_url}?{'&'.join(filtered_params)}"
    else:
        DATABASE_URL = base_url

# Create async engine for PostgreSQL with proper connection settings for Neon
# Enable pool_pre_ping to handle connection issues with serverless databases like Neon
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    async_engine = create_async_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before use (helpful for serverless DBs)
        pool_recycle=300,    # Recycle connections every 5 minutes
        # Additional settings for Neon PostgreSQL compatibility
        connect_args={
            "server_settings": {
                "application_name": "todo-app",
            }
        }
    )
elif DATABASE_URL.startswith("sqlite+aiosqlite://"):
    # Handle SQLite async engine creation
    async_engine = create_async_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before use
        pool_recycle=300,    # Recycle connections every 5 minutes
        # SQLite-specific settings
        connect_args={
            "check_same_thread": False  # Allow multiple threads to access the database
        }
    )
else:
    async_engine = create_async_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before use (helpful for serverless DBs)
        pool_recycle=300,    # Recycle connections every 5 minutes
    )

# Create sync engine for synchronous operations
if DATABASE_URL.startswith("postgresql+asyncpg://"):
    # Replace with sync driver for synchronous operations
    sync_db_url = DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
    engine = create_sync_engine(sync_db_url, pool_pre_ping=True, pool_recycle=300)
elif DATABASE_URL.startswith("sqlite+aiosqlite://"):
    # Handle SQLite sync engine creation
    engine = create_sync_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300, connect_args={"check_same_thread": False})
else:
    engine = create_sync_engine(DATABASE_URL, pool_pre_ping=True, pool_recycle=300)

# Create async sessionmaker
async_session = async_sessionmaker(async_engine, class_=AsyncSession, expire_on_commit=False)

async def get_db_session():
    """Dependency for FastAPI to get async database session"""
    async with async_session() as session:
        yield session
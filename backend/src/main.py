from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .api.auth import auth_router
from .api.tasks import tasks_router
from .config.database import async_engine
from sqlmodel import SQLModel
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan to handle startup and shutdown events"""
    # Startup
    print("Initializing database...")

    # Create tables
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    print("Database initialized.")
    yield
    # Shutdown


# Create FastAPI app with lifespan
app = FastAPI(
    title="Todo Web Application API",
    description="Secure API for todo web application with JWT authentication",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
# Get allowed origins from environment variable, with defaults for local development
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001").split(",")
# Add the Vercel production origin if not already present
vercel_origin = "https://full-stack-evolution-of-todo-hackat.vercel.app"
if vercel_origin not in allowed_origins:
    allowed_origins.append(vercel_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],  # Allow these methods including PATCH
    allow_headers=["*"],  # Allow all headers including Authorization and Content-Type
)

# Include API routers
app.include_router(auth_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Todo Web Application API"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "todo-api"}
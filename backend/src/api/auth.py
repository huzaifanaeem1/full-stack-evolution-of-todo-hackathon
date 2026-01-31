from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Annotated
from uuid import UUID
from ..models.user import User, UserCreate, UserRead, UserLogin
from ..services.auth import (
    authenticate_user,
    create_access_token,
    register_user,
    get_user_by_email,
    get_current_user
)
from ..config.database import get_db_session
from datetime import timedelta

auth_router = APIRouter(prefix="/auth", tags=["auth"])

@auth_router.post("/register", response_model=UserRead)
async def register(
    user_data: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db_session)]
):
    """Register a new user account"""
    # Check if user already exists
    existing_user = await get_user_by_email(user_data.email, db)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )

    # Register the new user
    user = await register_user(user_data, db)
    return user


@auth_router.post("/login")
async def login(
    user_credentials: UserLogin,
    db: Annotated[AsyncSession, Depends(get_db_session)]
):
    """Authenticate user and return JWT token"""
    user = await authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=30)  # 30 minutes expiration
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )

    return {
        "user": {
            "id": user.id,
            "email": user.email,
        },
        "token": access_token
    }


@auth_router.get("/me", response_model=UserRead)
async def read_current_user_endpoint(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user info"""
    return current_user
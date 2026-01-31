from datetime import datetime
from typing import Optional
from fastapi import HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from starlette.status import HTTP_401_UNAUTHORIZED, HTTP_403_FORBIDDEN
from pydantic import BaseModel
from uuid import UUID
import os


class JWTPayload(BaseModel):
    """Payload structure for JWT token."""
    user_id: UUID
    exp: datetime
    iat: datetime


class JWTBearer(HTTPBearer):
    """Custom JWT authentication scheme."""

    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(self, request: Request):
        credentials: Optional[HTTPAuthorizationCredentials] = await super().__call__(request)

        if credentials is None:
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="No authorization credentials provided"
            )

        if credentials.scheme.lower() != "bearer":
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication scheme"
            )

        token = credentials.credentials

        try:
            payload = jwt.decode(
                token,
                os.getenv("BETTER_AUTH_SECRET"),
                algorithms=["HS256"]
            )
            user_id = payload.get("user_id")

            if user_id is None:
                raise HTTPException(
                    status_code=HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: no user_id"
                )

            # Add user_id to request state for later use
            request.state.user_id = UUID(user_id)
            return user_id

        except JWTError:
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )


def verify_user_id_match(token_user_id: UUID, path_user_id: UUID) -> bool:
    """
    Verify that the user_id in the JWT token matches the user_id in the path parameter.

    Args:
        token_user_id: User ID from JWT token
        path_user_id: User ID from path parameter

    Returns:
        bool: True if IDs match, raises HTTPException if they don't
    """
    if token_user_id != path_user_id:
        raise HTTPException(
            status_code=HTTP_403_FORBIDDEN,
            detail="User ID in token does not match user ID in request path"
        )
    return True


def get_current_user_id(request: Request) -> UUID:
    """
    Get the current user ID from the request state.

    Args:
        request: FastAPI request object

    Returns:
        UUID: The current user's ID
    """
    if not hasattr(request.state, 'user_id'):
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED,
            detail="User ID not found in request state"
        )
    return request.state.user_id
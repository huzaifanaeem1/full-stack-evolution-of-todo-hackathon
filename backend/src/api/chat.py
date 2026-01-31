from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
from uuid import UUID
from sqlmodel.ext.asyncio.session import AsyncSession
from jose import JWTError, jwt
from ..config.database import get_db_session
from ..services.chat_service import ChatService
from ..agents.chat_agent import ChatAgent
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# JWT configuration
SECRET_KEY = os.getenv("BETTER_AUTH_SECRET")
if not SECRET_KEY:
    raise ValueError("BETTER_AUTH_SECRET environment variable must be set for security")
ALGORITHM = "HS256"

# HTTP Bearer scheme for authentication
security = HTTPBearer()

router = APIRouter(prefix="/chat", tags=["chat"])


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UUID:
    """Get current user ID from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        # Validate that user_id is a valid UUID
        user_uuid = UUID(user_id)
        return user_uuid

    except JWTError:
        raise credentials_exception
    except ValueError:
        raise credentials_exception


@router.post("/{user_id}")
async def chat_endpoint(
    user_id: str,
    conversation_request: Dict[str, Any],
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, Any]:
    """
    Chat endpoint for AI-powered todo management.

    Args:
        user_id: ID of the user making the request
        conversation_request: Request body with conversation_id and message
        current_user_id: The ID of the current authenticated user (from JWT)
        db: Database session

    Returns:
        Response with conversation_id, response, tool_calls, and tool_results
    """
    try:
        # Validate that the user_id in the path matches the authenticated user
        try:
            requested_user_id = UUID(user_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )

        # Ensure the authenticated user is operating on their own data
        if requested_user_id != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot access another user's resources"
            )

        # Extract request parameters
        conversation_id_str = conversation_request.get("conversation_id")
        message = conversation_request.get("message")

        # Validate message
        if not message or not isinstance(message, str):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message is required and must be a string"
            )

        if len(message) < 1 or len(message) > 1000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message must be between 1 and 1000 characters"
            )

        # Initialize services
        chat_service = ChatService(db)

        # Create or get conversation
        conversation = await chat_service.create_or_get_conversation(
            requested_user_id,
            conversation_id_str
        )

        # Save user message
        user_message = await chat_service.save_user_message(conversation.id, message)

        # Get conversation history for context
        conversation_history = await chat_service.get_conversation_history(conversation.id)

        # Initialize the AI agent
        agent = ChatAgent()

        # Get MCP tools for this user
        mcp_tools = chat_service.get_mcp_tools_for_user(requested_user_id)

        # Process the message with the agent
        result = await agent.process_message(
            message,
            conversation_history[:-1],  # Exclude the current message from history
            mcp_tools
        )

        # Save AI response message
        ai_message = await chat_service.save_ai_message(
            conversation.id,
            result["response"],
            metadata={"tool_calls": result["tool_calls"], "tool_results": result["tool_results"]}
        )

        # Return response
        return {
            "conversation_id": str(conversation.id),
            "response": result["response"],
            "tool_calls": result["tool_calls"],
            "tool_results": result["tool_results"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )


# Additional endpoint for getting conversation history
@router.get("/{user_id}/{conversation_id}")
async def get_conversation_history(
    user_id: str,
    conversation_id: str,
    current_user_id: UUID = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get conversation history for a specific conversation.

    Args:
        user_id: ID of the user
        conversation_id: ID of the conversation
        current_user_id: The ID of the current authenticated user (from JWT)
        db: Database session

    Returns:
        Conversation history
    """
    try:
        # Validate that the user_id in the path matches the authenticated user
        user_uuid = UUID(user_id)
        conv_uuid = UUID(conversation_id)

        # Ensure the authenticated user is operating on their own data
        if user_uuid != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Cannot access another user's resources"
            )

        # Initialize service
        chat_service = ChatService(db)

        # Verify user owns the conversation
        conversation = await chat_service.db_service.get_conversation_by_id(db, conv_uuid, user_uuid)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found or not owned by user"
            )

        # Get conversation history
        history = await chat_service.get_conversation_history(conv_uuid)

        return {
            "conversation_id": str(conversation_id),
            "history": history
        }

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid UUID format"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )
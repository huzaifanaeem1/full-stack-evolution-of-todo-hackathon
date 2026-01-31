import json
from typing import Dict, List, Any, Optional
from uuid import UUID
from datetime import datetime
from sqlmodel.ext.asyncio.session import AsyncSession
from ..models.conversation import Conversation
from ..models.message import Message
from .database import DatabaseService
from .mcp_tools import MCPTaskTools


class ChatService:
    """
    Service layer for chat functionality including conversation management
    and message persistence.
    """

    def __init__(self, db_session: AsyncSession):
        self.db_session = db_session
        self.db_service = DatabaseService()

    async def create_or_get_conversation(self, user_id: UUID, conversation_id: Optional[str] = None) -> Conversation:
        """
        Create a new conversation or get an existing one.

        Args:
            user_id: ID of the user
            conversation_id: Optional ID of existing conversation

        Returns:
            Conversation object
        """
        if conversation_id:
            # Try to get existing conversation
            conv_uuid = UUID(conversation_id)
            existing_conv = await self.db_service.get_conversation_by_id(self.db_session, conv_uuid, user_id)
            if existing_conv:
                return existing_conv
            else:
                raise ValueError(f"Conversation with ID {conversation_id} not found or not owned by user")

        # Create new conversation
        title = f"Conversation {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
        return await self.db_service.create_conversation(self.db_session, user_id, title)

    async def save_user_message(self, conversation_id: UUID, content: str) -> Message:
        """
        Save a user message to the database.

        Args:
            conversation_id: ID of the conversation
            content: Message content

        Returns:
            Saved Message object
        """
        return await self.db_service.create_message(
            self.db_session,
            conversation_id,
            "user",
            content
        )

    async def save_ai_message(self, conversation_id: UUID, content: str, metadata: Optional[Dict[str, Any]] = None) -> Message:
        """
        Save an AI message to the database.

        Args:
            conversation_id: ID of the conversation
            content: Message content
            metadata: Optional metadata about the message (tool calls, etc.)

        Returns:
            Saved Message object
        """
        metadata_json = None
        if metadata:
            metadata_json = json.dumps(metadata)

        return await self.db_service.create_message(
            self.db_session,
            conversation_id,
            "assistant",
            content,
            metadata_json=metadata_json
        )

    async def get_conversation_history(self, conversation_id: UUID) -> List[Dict[str, Any]]:
        """
        Get the full conversation history for context reconstruction.

        Args:
            conversation_id: ID of the conversation

        Returns:
            List of messages with role and content
        """
        messages = await self.db_service.get_messages_by_conversation(self.db_session, conversation_id)
        return [
            {
                "role": msg.role,
                "content": msg.content,
                "timestamp": msg.timestamp.isoformat()
            }
            for msg in messages
        ]

    def get_mcp_tools_for_user(self, user_id: UUID) -> MCPTaskTools:
        """
        Get MCP tools configured for a specific user.

        Args:
            user_id: ID of the user

        Returns:
            MCPTaskTools instance configured for the user
        """
        # Create and return MCPTaskTools without a shared session
        # Each operation will create its own session
        tools = MCPTaskTools(user_id)
        return tools
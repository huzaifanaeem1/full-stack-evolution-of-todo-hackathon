from sqlmodel import SQLModel, Field, Relationship
from typing import TYPE_CHECKING, Optional
from datetime import datetime
from uuid import UUID, uuid4
if TYPE_CHECKING:
    from .conversation import Conversation


class Message(SQLModel, table=True):
    __tablename__ = "messages"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    conversation_id: UUID = Field(foreign_key="conversations.id", index=True)
    role: str = Field(regex="^(user|assistant)$")  # user or assistant
    content: str = Field(min_length=1)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata_json: Optional[str] = Field(default=None)  # For tool call results, etc.

    # Relationships
    conversation: "Conversation" = Relationship(back_populates="messages")

    def __str__(self):
        return f"Message(id={self.id}, role='{self.role}', conversation_id={self.conversation_id})"
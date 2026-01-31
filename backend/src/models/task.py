from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4
from sqlmodel import Field, SQLModel, Relationship
from sqlalchemy import Column

if TYPE_CHECKING:
    from .user import User  # Import for type checking to avoid circular import


class TaskBase(SQLModel):
    title: str = Field(max_length=255)
    description: Optional[str] = Field(default=None)
    due_date: Optional[datetime] = Field(default=None)
    completed: bool = Field(default=False)
    priority: int = Field(default=3, ge=1, le=5)  # 1-5 scale
    category: Optional[str] = Field(default=None, max_length=50)
    user_id: UUID = Field(index=True)


class Task(TaskBase, table=True):
    """Task model representing a user's todo item."""

    __tablename__ = "tasks"

    id: UUID = Field(default_factory=uuid4, primary_key=True, nullable=False)
    user_id: UUID = Field(foreign_key="user.id", index=True)  # Foreign key to user table
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    # Relationship to user
    user: Optional["User"] = Relationship(back_populates="tasks")


class TaskCreate(TaskBase):
    """Schema for creating a new task."""
    title: str
    user_id: UUID


class TaskRead(TaskBase):
    """Schema for reading a task."""
    id: UUID
    created_at: datetime
    updated_at: datetime


class TaskUpdate(SQLModel):
    """Schema for updating a task."""
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None
    priority: Optional[int] = Field(default=None, ge=1, le=5)
    category: Optional[str] = None
from sqlmodel import SQLModel, Field, Relationship
from typing import TYPE_CHECKING, Optional
from datetime import datetime
import uuid
from pydantic import BaseModel

if TYPE_CHECKING:
    from .task import Task  # Import for type checking to avoid circular import
    from .conversation import Conversation  # Import for type checking to avoid circular import


class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    is_active: bool = Field(default=True)


class User(UserBase, table=True):
    __tablename__ = "user"  # Explicit table name to match the foreign key reference

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationship to tasks
    tasks: list["Task"] = Relationship(back_populates="user")

    # Relationship to conversations
    conversations: list["Conversation"] = Relationship(back_populates="user")


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: uuid.UUID
    created_at: datetime


class UserUpdate(SQLModel):
    email: Optional[str] = None
    is_active: Optional[bool] = None


class UserLogin(SQLModel):
    email: str
    password: str


class UserWithPasswordHash(UserRead):
    password_hash: str
from typing import List, Optional
from sqlmodel import Session, select, func
from uuid import UUID
from ..models.task import Task, TaskCreate, TaskUpdate
from ..models.conversation import Conversation
from ..models.message import Message


class SyncDatabaseService:
    """Synchronous database service layer for all data operations."""

    @staticmethod
    def create_task(session: Session, task_create: TaskCreate) -> Task:
        """Create a new task."""
        # Create task instance manually to avoid from_orm issue
        db_task = Task(
            title=task_create.title,
            description=task_create.description,
            due_date=task_create.due_date,
            completed=task_create.completed,
            priority=task_create.priority,
            category=task_create.category,
            user_id=task_create.user_id
        )
        session.add(db_task)
        session.commit()
        session.refresh(db_task)
        return db_task

    @staticmethod
    def get_task_by_id(session: Session, task_id: UUID, user_id: UUID) -> Optional[Task]:
        """Get a task by ID for a specific user."""
        statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
        result = session.exec(statement)
        return result.first()

    @staticmethod
    def get_tasks_by_user(session: Session, user_id: UUID, completed: Optional[bool] = None) -> List[Task]:
        """Get all tasks for a specific user."""
        statement = select(Task).where(Task.user_id == user_id)

        if completed is not None:
            statement = statement.where(Task.completed == completed)

        statement = statement.order_by(Task.created_at.desc())
        result = session.exec(statement)
        return result.all()

    @staticmethod
    def update_task(session: Session, task_id: UUID, user_id: UUID, task_update: TaskUpdate) -> Optional[Task]:
        """Update a task for a specific user."""
        db_task = SyncDatabaseService.get_task_by_id(session, task_id, user_id)
        if not db_task:
            return None

        update_data = task_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_task, field, value)

        db_task.updated_at = func.now()
        session.add(db_task)
        session.commit()
        session.refresh(db_task)
        return db_task

    @staticmethod
    def delete_task(session: Session, task_id: UUID, user_id: UUID) -> bool:
        """Delete a task for a specific user."""
        db_task = SyncDatabaseService.get_task_by_id(session, task_id, user_id)
        if not db_task:
            return False

        session.delete(db_task)
        session.commit()
        return True

    @staticmethod
    def create_conversation(session: Session, user_id: UUID, title: str) -> Conversation:
        """Create a new conversation."""
        db_conversation = Conversation(
            user_id=user_id,
            title=title
        )
        session.add(db_conversation)
        session.commit()
        session.refresh(db_conversation)
        return db_conversation

    @staticmethod
    def get_conversation_by_id(session: Session, conversation_id: UUID, user_id: UUID) -> Optional[Conversation]:
        """Get a conversation by ID for a specific user."""
        statement = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        )
        result = session.exec(statement)
        return result.first()

    @staticmethod
    def get_conversations_by_user(session: Session, user_id: UUID) -> List[Conversation]:
        """Get all conversations for a specific user."""
        statement = select(Conversation).where(Conversation.user_id == user_id).order_by(Conversation.created_at.desc())
        result = session.exec(statement)
        return result.all()

    @staticmethod
    def update_conversation(session: Session, conversation_id: UUID, user_id: UUID, title: str) -> Optional[Conversation]:
        """Update a conversation for a specific user."""
        db_conversation = SyncDatabaseService.get_conversation_by_id(session, conversation_id, user_id)
        if not db_conversation:
            return None

        db_conversation.title = title
        db_conversation.updated_at = func.now()
        session.add(db_conversation)
        session.commit()
        session.refresh(db_conversation)
        return db_conversation

    @staticmethod
    def create_message(session: Session, conversation_id: UUID, role: str, content: str, metadata_json: Optional[str] = None) -> Message:
        """Create a new message."""
        db_message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            metadata_json=metadata_json
        )
        session.add(db_message)
        session.commit()
        session.refresh(db_message)
        return db_message

    @staticmethod
    def get_messages_by_conversation(session: Session, conversation_id: UUID) -> List[Message]:
        """Get all messages for a specific conversation."""
        statement = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.timestamp.asc())
        result = session.exec(statement)
        return result.all()

    @staticmethod
    def get_latest_messages(session: Session, conversation_id: UUID, limit: int = 10) -> List[Message]:
        """Get the latest messages for a specific conversation."""
        statement = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.timestamp.desc())
            .limit(limit)
        )
        result = session.exec(statement)
        return result.all()

    @staticmethod
    def get_message_by_id(session: Session, message_id: UUID) -> Optional[Message]:
        """Get a message by ID."""
        statement = select(Message).where(Message.id == message_id)
        result = session.exec(statement)
        return result.first()
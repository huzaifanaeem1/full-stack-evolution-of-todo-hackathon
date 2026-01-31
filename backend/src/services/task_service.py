from sqlmodel import select
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List, Optional
from uuid import UUID
from ..models.task import Task, TaskCreate, TaskUpdate


async def create_task_for_user(task_data: TaskCreate, user_id: UUID, db) -> Task:
    """Create a new task for a specific user"""
    # Create the task object with the user_id
    db_task = Task(
        title=task_data.title,
        description=task_data.description,
        completed=task_data.completed,
        user_id=user_id
    )

    try:
        db.add(db_task)
        await db.commit()
        await db.refresh(db_task)
        return db_task
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating task"
        )


async def get_tasks_for_user(user_id: UUID, db) -> List[Task]:
    """Get all tasks for a specific user"""
    statement = select(Task).where(Task.user_id == user_id)
    result = await db.execute(statement)
    tasks = result.scalars().all()
    return tasks


async def get_task_by_id_and_user(task_id: UUID, user_id: UUID, db) -> Optional[Task]:
    """Get a specific task by ID for a specific user"""
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    result = await db.execute(statement)
    task = result.scalar_one_or_none()
    return task


async def update_task_by_id_and_user(task_id: UUID, task_data: TaskUpdate, user_id: UUID, db) -> Optional[Task]:
    """Update a specific task by ID for a specific user"""
    # Get the existing task
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    result = await db.execute(statement)
    task = result.scalar_one_or_none()

    if not task:
        return None

    # Update the task with provided fields
    update_data = task_data.dict(exclude_unset=True)

    for field, value in update_data.items():
        setattr(task, field, value)

    try:
        await db.commit()
        await db.refresh(task)
        return task
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating task"
        )


async def patch_task_completion_status(task_id: UUID, is_completed: bool, user_id: UUID, db) -> Optional[Task]:
    """Update task completion status by ID for a specific user"""
    # Get the existing task
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    result = await db.execute(statement)
    task = result.scalar_one_or_none()

    if not task:
        return None

    # Update the completion status
    task.completed = is_completed

    try:
        await db.commit()
        await db.refresh(task)
        return task
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating task completion status"
        )


async def delete_task_by_id_and_user(task_id: UUID, user_id: UUID, db) -> bool:
    """Delete a specific task by ID for a specific user"""
    statement = select(Task).where(Task.id == task_id, Task.user_id == user_id)
    result = await db.execute(statement)
    task = result.scalar_one_or_none()

    if not task:
        return False

    try:
        await db.delete(task)
        await db.commit()
        return True
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting task"
        )
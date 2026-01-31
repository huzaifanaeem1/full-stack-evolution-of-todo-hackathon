from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession
from typing import Annotated, List
from uuid import UUID
from pydantic import BaseModel
from ..models.task import Task, TaskCreate, TaskRead, TaskUpdate
from ..models.user import User
from ..services.task_service import (
    create_task_for_user,
    get_tasks_for_user,
    get_task_by_id_and_user,
    update_task_by_id_and_user,
    patch_task_completion_status,
    delete_task_by_id_and_user
)
from ..services.auth import get_current_user
from ..config.database import get_db_session as get_async_db_session


class TaskPatch(BaseModel):
    completed: bool

tasks_router = APIRouter(prefix="/{user_id}/tasks", tags=["tasks"])

@tasks_router.get("/", response_model=List[TaskRead])
async def get_user_tasks(
    user_id: UUID,
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    current_user: User = Depends(get_current_user)
):
    """Get all tasks for a specific user"""
    # Verify that the user_id in the URL matches the authenticated user
    if str(current_user.id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied - cannot access another user's tasks"
        )

    tasks = await get_tasks_for_user(user_id, db)
    return tasks


@tasks_router.post("/", response_model=TaskRead)
async def create_user_task(
    user_id: UUID,
    task_data: TaskCreate,
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    current_user: User = Depends(get_current_user)
):
    """Create a new task for a specific user"""
    # Verify that the user_id in the URL matches the authenticated user
    if str(current_user.id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied - cannot create tasks for another user"
        )

    # Create the task with the user_id from the URL to ensure consistency
    task = await create_task_for_user(task_data, user_id, db)
    return task


@tasks_router.get("/{id}", response_model=TaskRead)
async def get_user_task(
    user_id: UUID,
    id: UUID,
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    current_user: User = Depends(get_current_user)
):
    """Get a specific task by ID for a specific user"""
    # Verify that the user_id in the URL matches the authenticated user
    if str(current_user.id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied - cannot access another user's task"
        )

    task = await get_task_by_id_and_user(id, user_id, db)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return task


@tasks_router.put("/{id}", response_model=TaskRead)
async def update_user_task(
    user_id: UUID,
    id: UUID,
    task_data: TaskUpdate,
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    current_user: User = Depends(get_current_user)
):
    """Update a specific task by ID for a specific user"""
    # Verify that the user_id in the URL matches the authenticated user
    if str(current_user.id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied - cannot update another user's task"
        )

    task = await update_task_by_id_and_user(id, task_data, user_id, db)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return task


@tasks_router.patch("/{id}/complete", response_model=TaskRead)
async def update_task_completion(
    user_id: UUID,
    id: UUID,
    task_patch: TaskPatch,
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    current_user: User = Depends(get_current_user)
):
    """Update completion status of a specific task by ID for a specific user"""
    # Verify that the user_id in the URL matches the authenticated user
    if str(current_user.id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied - cannot update another user's task"
        )

    task = await patch_task_completion_status(id, task_patch.completed, user_id, db)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return task


@tasks_router.delete("/{id}")
async def delete_user_task(
    user_id: UUID,
    id: UUID,
    db: Annotated[AsyncSession, Depends(get_async_db_session)],
    current_user: User = Depends(get_current_user)
):
    """Delete a specific task by ID for a specific user"""
    # Verify that the user_id in the URL matches the authenticated user
    if str(current_user.id) != str(user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied - cannot delete another user's task"
        )

    success = await delete_task_by_id_and_user(id, user_id, db)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return {"message": "Task deleted successfully"}
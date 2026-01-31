from sqlmodel import Session
from uuid import UUID
from typing import List, Optional, Dict, Any
from datetime import datetime
import json
from .database_sync import SyncDatabaseService
from ..models.task import TaskCreate, TaskUpdate


class MCPTaskTools:
    """
    Task management tools for the AI agent to use for task operations.
    These tools will be exposed to the AI agent for task operations.
    """

    def __init__(self, user_id: UUID):
        self.user_id = user_id
        self.db_service = SyncDatabaseService()

    def _convert_priority_string_to_int(self, priority_str: str) -> int:
        """
        Convert priority string to integer value for Task model.

        Args:
            priority_str: Priority as string ('low', 'medium', 'high')

        Returns:
            Priority as integer (1 for low, 3 for medium, 5 for high)
        """
        priority_mapping = {
            'low': 1,
            'medium': 3,
            'high': 5
        }
        return priority_mapping.get(priority_str.lower(), 3)  # default to medium (3)

    def _convert_priority_int_to_string(self, priority_int: int) -> str:
        """
        Convert priority integer to string representation.

        Args:
            priority_int: Priority as integer (1-5 scale)

        Returns:
            Priority as string ('low', 'medium', 'high')
        """
        if priority_int <= 2:
            return 'low'
        elif priority_int <= 4:
            return 'medium'
        else:
            return 'high'

    async def add_task(self, title: str, description: Optional[str] = None,
                       due_date: Optional[str] = None, priority: Optional[str] = "medium",
                       category: Optional[str] = None) -> Dict[str, Any]:
        """
        Create a new task for the current user.

        Args:
            title: Task title
            description: Task description (optional)
            due_date: ISO 8601 datetime string (optional)
            priority: Task priority ('low', 'medium', 'high', default: 'medium')
            category: Task category (optional)

        Returns:
            Created task information
        """
        from ..config.database import async_engine
        from ..services.database import DatabaseService
        from sqlmodel.ext.asyncio.session import AsyncSession

        try:
            # Validate priority
            if priority not in ["low", "medium", "high"]:
                raise Exception(f"Priority must be one of 'low', 'medium', 'high', got '{priority}'")

            # Parse due_date if provided
            parsed_due_date = None
            if due_date:
                try:
                    parsed_due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                except ValueError:
                    raise Exception(f"Invalid due_date format: {due_date}. Expected ISO 8601 format.")

            # Convert priority string to integer for Task model
            priority_int = self._convert_priority_string_to_int(priority)

            # Create task object
            task_create = TaskCreate(
                title=title,
                description=description,
                due_date=parsed_due_date,
                priority=priority_int,
                category=category,
                user_id=self.user_id,
                completed=False
            )

            # Create task in database using async operations
            async with AsyncSession(async_engine) as session:
                task = await DatabaseService.create_task(session, task_create)

            return {
                "id": str(task.id),
                "title": task.title,
                "description": task.description,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "completed": task.completed,
                "priority": self._convert_priority_int_to_string(task.priority),  # Convert back to string for API
                "category": task.category,
                "created_at": task.created_at.isoformat(),
                "updated_at": task.updated_at.isoformat()
            }
        except Exception as e:
            raise Exception(f"Failed to add task: {str(e)}")

    async def list_tasks(self, completed: Optional[bool] = None,
                         priority: Optional[str] = None,
                         category: Optional[str] = None,
                         limit: Optional[int] = 50) -> List[Dict[str, Any]]:
        """
        Retrieve tasks for the current user with optional filters.

        Args:
            completed: Filter by completion status (optional)
            priority: Filter by priority level (optional)
            category: Filter by category (optional)
            limit: Maximum number of tasks to return (default: 50)

        Returns:
            List of matching tasks
        """
        from ..config.database import async_engine
        from ..services.database import DatabaseService
        from sqlmodel.ext.asyncio.session import AsyncSession

        try:
            # Get all tasks for user using async operations
            async with AsyncSession(async_engine) as session:
                tasks = await DatabaseService.get_tasks_by_user(
                    session,
                    self.user_id,
                    completed=completed
                )

            # Apply additional filters in memory
            filtered_tasks = []
            for task in tasks:
                # Filter by priority if specified (convert string to int for comparison)
                if priority is not None:
                    task_priority_str = self._convert_priority_int_to_string(task.priority)
                    if task_priority_str != priority:
                        continue

                # Filter by category if specified
                if category is not None and task.category != category:
                    continue

                # Add to filtered list
                filtered_tasks.append({
                    "id": str(task.id),
                    "title": task.title,
                    "description": task.description,
                    "due_date": task.due_date.isoformat() if task.due_date else None,
                    "completed": task.completed,
                    "priority": self._convert_priority_int_to_string(task.priority),  # Convert back to string for API
                    "category": task.category,
                    "created_at": task.created_at.isoformat(),
                    "updated_at": task.updated_at.isoformat()
                })

                # Respect limit
                if len(filtered_tasks) >= limit:
                    break

            return filtered_tasks
        except Exception as e:
            raise Exception(f"Failed to list tasks: {str(e)}")

    async def complete_task(self, task_id: str) -> Dict[str, Any]:
        """
        Mark a task as completed for the current user.

        Args:
            task_id: ID of the task to complete

        Returns:
            Updated task information
        """
        from ..config.database import async_engine
        from ..services.database import DatabaseService
        from sqlmodel.ext.asyncio.session import AsyncSession

        try:
            task_uuid = UUID(task_id)

            # Prepare update object
            task_update = TaskUpdate(
                completed=True
            )

            # Update task in database using async operations
            async with AsyncSession(async_engine) as session:
                updated_task = await DatabaseService.update_task(
                    session,
                    task_uuid,
                    self.user_id,
                    task_update
                )

            if not updated_task:
                raise Exception(f"Task with ID {task_id} not found or not owned by user")

            return {
                "id": str(updated_task.id),
                "title": updated_task.title,
                "completed": updated_task.completed,
                "priority": self._convert_priority_int_to_string(updated_task.priority),  # Include priority for consistency
                "updated_at": updated_task.updated_at.isoformat()
            }
        except ValueError:
            raise Exception(f"Invalid task ID format: {task_id}")
        except Exception as e:
            raise Exception(f"Failed to complete task: {str(e)}")

    async def complete_task_by_title(self, task_title: str) -> Dict[str, Any]:
        """
        Mark a task as completed for the current user by matching the title.

        Args:
            task_title: Title of the task to complete (will match using substring)

        Returns:
            Updated task information
        """
        # First list tasks to find the one with matching title
        all_tasks = await self.list_tasks()

        # Find task with matching title (case-insensitive substring match)
        matching_task = None
        for task in all_tasks:
            if task_title.lower() in task.get('title', '').lower():
                matching_task = task
                break

        if not matching_task:
            raise Exception(f"No task found with title containing '{task_title}'")

        # Now call the regular complete_task with the found ID
        return await self.complete_task(matching_task['id'])

    async def delete_task(self, task_id: str) -> bool:
        """
        Delete a task for the current user.

        Args:
            task_id: ID of the task to delete

        Returns:
            Success status
        """
        from ..config.database import async_engine
        from ..services.database import DatabaseService
        from sqlmodel.ext.asyncio.session import AsyncSession

        try:
            task_uuid = UUID(task_id)

            # Delete task from database using async operations
            async with AsyncSession(async_engine) as session:
                success = await DatabaseService.delete_task(
                    session,
                    task_uuid,
                    self.user_id
                )

            if not success:
                raise Exception(f"Task with ID {task_id} not found or not owned by user")

            return success
        except ValueError:
            raise Exception(f"Invalid task ID format: {task_id}")
        except Exception as e:
            raise Exception(f"Failed to delete task: {str(e)}")

    async def delete_task_by_title(self, task_title: str) -> Dict[str, Any]:
        """
        Delete a task for the current user by matching the title.

        Args:
            task_title: Title of the task to delete (will match using substring)

        Returns:
            Dictionary with success status and deleted task info
        """
        # First list tasks to find the one with matching title
        all_tasks = await self.list_tasks()

        # Find task with matching title (case-insensitive substring match)
        matching_task = None
        for task in all_tasks:
            if task_title.lower() in task.get('title', '').lower():
                matching_task = task
                break

        if not matching_task:
            raise Exception(f"No task found with title containing '{task_title}'")

        # Now call the regular delete_task with the found ID
        success = await self.delete_task(matching_task['id'])

        return {
            "success": success,
            "deleted_task": matching_task
        }

    async def update_task(self, task_id: str, title: Optional[str] = None,
                          description: Optional[str] = None, due_date: Optional[str] = None,
                          completed: Optional[bool] = None, priority: Optional[str] = None,
                          category: Optional[str] = None) -> Dict[str, Any]:
        """
        Update properties of an existing task for the current user.

        Args:
            task_id: ID of the task to update
            title: New task title (optional)
            description: New task description (optional)
            due_date: New due date in ISO 8601 format (optional)
            completed: New completion status (optional)
            priority: New priority level (optional)
            category: New category (optional)

        Returns:
            Updated task information
        """
        from ..config.database import async_engine
        from ..services.database import DatabaseService
        from sqlmodel.ext.asyncio.session import AsyncSession

        try:
            task_uuid = UUID(task_id)

            # Parse due_date if provided
            parsed_due_date = None
            if due_date:
                try:
                    parsed_due_date = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
                except ValueError:
                    raise Exception(f"Invalid due_date format: {due_date}. Expected ISO 8601 format.")

            # Prepare update object with only non-None values
            update_data = {}
            if title is not None:
                update_data["title"] = title
            if description is not None:
                update_data["description"] = description
            if parsed_due_date is not None:
                update_data["due_date"] = parsed_due_date
            if completed is not None:
                update_data["completed"] = completed
            if priority is not None:
                if priority not in ["low", "medium", "high"]:
                    raise Exception(f"Priority must be one of 'low', 'medium', 'high', got '{priority}'")
                # Convert priority string to integer for Task model
                update_data["priority"] = self._convert_priority_string_to_int(priority)
            if category is not None:
                update_data["category"] = category

            # Create TaskUpdate object with only the fields that were provided
            task_update = TaskUpdate(**update_data)

            # Update task in database using async operations
            async with AsyncSession(async_engine) as session:
                updated_task = await DatabaseService.update_task(
                    session,
                    task_uuid,
                    self.user_id,
                    task_update
                )

            if not updated_task:
                raise Exception(f"Task with ID {task_id} not found or not owned by user")

            return {
                "id": str(updated_task.id),
                "title": updated_task.title,
                "description": updated_task.description,
                "due_date": updated_task.due_date.isoformat() if updated_task.due_date else None,
                "completed": updated_task.completed,
                "priority": self._convert_priority_int_to_string(updated_task.priority),  # Convert back to string for API
                "category": updated_task.category,
                "updated_at": updated_task.updated_at.isoformat()
            }
        except ValueError as ve:
            if "Invalid UUID" in str(ve):
                raise Exception(f"Invalid task ID format: {task_id}")
            else:
                raise Exception(f"Invalid date format: {str(ve)}")
        except Exception as e:
            raise Exception(f"Failed to update task: {str(e)}")

    async def update_task_by_title(self, task_title: str, title: Optional[str] = None,
                                   description: Optional[str] = None, due_date: Optional[str] = None,
                                   completed: Optional[bool] = None, priority: Optional[str] = None,
                                   category: Optional[str] = None) -> Dict[str, Any]:
        """
        Update properties of an existing task for the current user by matching the title.

        Args:
            task_title: Title of the task to update (will match using substring)
            title: New task title (optional)
            description: New task description (optional)
            due_date: New due date in ISO 8601 format (optional)
            completed: New completion status (optional)
            priority: New priority level (optional)
            category: New category (optional)

        Returns:
            Updated task information
        """
        # First list tasks to find the one with matching title
        all_tasks = await self.list_tasks()

        # Find task with matching title (case-insensitive substring match)
        matching_task = None
        for task in all_tasks:
            if task_title.lower() in task.get('title', '').lower():
                matching_task = task
                break

        if not matching_task:
            raise Exception(f"No task found with title containing '{task_title}'")

        # Now call the regular update_task with the found ID
        return await self.update_task(
            matching_task['id'],
            title=title,
            description=description,
            due_date=due_date,
            completed=completed,
            priority=priority,
            category=category
        )
import json
from typing import Dict, Any, List, Optional
from openai import OpenAI
from mcp.server import Server
from .prompts import SYSTEM_PROMPT
import os


class ChatAgent:
    """
    AI Agent for handling natural language todo management using OpenAI API
    and MCP tools for task operations.
    """

    def __init__(self):
        # Initialize OpenAI client
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")

        self.client = OpenAI(api_key=api_key)
        self.model = "gpt-4o"  # Use GPT-4o which is available in most accounts

    async def process_message(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        mcp_tools: Any  # MCPTaskTools instance
    ) -> Dict[str, Any]:
        """
        Process a user message and return the AI response along with tool calls.

        Args:
            user_message: The message from the user
            conversation_history: History of previous messages for context
            mcp_tools: MCP tools instance for task operations

        Returns:
            Dictionary with response, tool_calls, and tool_results
        """
        # Prepare the messages for the OpenAI API
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]

        # Add conversation history
        for msg in conversation_history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })

        # Add the current user message
        messages.append({
            "role": "user", "content": user_message
        })

        try:
            # Call OpenAI API with function calling enabled
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                tools=[
                    {
                        "type": "function",
                        "function": {
                            "name": "add_task",
                            "description": "Create a new task for the current user",
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "title": {"type": "string", "description": "Task title"},
                                    "description": {"type": "string", "description": "Task description"},
                                    "due_date": {"type": "string", "description": "ISO 8601 datetime string"},
                                    "priority": {"type": "string", "enum": ["low", "medium", "high"], "default": "medium"},
                                    "category": {"type": "string", "description": "Task category"}
                                },
                                "required": ["title"]
                            }
                        }
                    },
                    {
                        "type": "function",
                        "function": {
                            "name": "list_tasks",
                            "description": "Retrieve tasks for the current user with optional filters",
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "completed": {"type": "boolean", "description": "Filter by completion status"},
                                    "priority": {"type": "string", "enum": ["low", "medium", "high"], "description": "Filter by priority level"},
                                    "category": {"type": "string", "description": "Filter by category"},
                                    "limit": {"type": "integer", "description": "Maximum number of tasks to return", "default": 50}
                                }
                            }
                        }
                    },
                    {
                        "type": "function",
                        "function": {
                            "name": "complete_task",
                            "description": "Mark a task as completed for the current user",
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "task_id": {"type": "string", "description": "ID of the task to complete"}
                                },
                                "required": ["task_id"]
                            }
                        }
                    },
                    {
                        "type": "function",
                        "function": {
                            "name": "complete_task_by_title",
                            "description": "Mark a task as completed for the current user by matching the task title",
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "task_title": {"type": "string", "description": "Title of the task to complete (partial matches allowed)"}
                                },
                                "required": ["task_title"]
                            }
                        }
                    },
                    {
                        "type": "function",
                        "function": {
                            "name": "delete_task",
                            "description": "Remove a task for the current user",
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "task_id": {"type": "string", "description": "ID of the task to delete"}
                                },
                                "required": ["task_id"]
                            }
                        }
                    },
                    {
                        "type": "function",
                        "function": {
                            "name": "delete_task_by_title",
                            "description": "Remove a task for the current user by matching the task title",
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "task_title": {"type": "string", "description": "Title of the task to delete (partial matches allowed)"}
                                },
                                "required": ["task_title"]
                            }
                        }
                    },
                    {
                        "type": "function",
                        "function": {
                            "name": "update_task",
                            "description": "Modify properties of an existing task for the current user",
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "task_id": {"type": "string", "description": "ID of the task to update"},
                                    "title": {"type": "string", "description": "New task title"},
                                    "description": {"type": "string", "description": "New task description"},
                                    "due_date": {"type": "string", "description": "New due date in ISO 8601 format"},
                                    "completed": {"type": "boolean", "description": "New completion status"},
                                    "priority": {"type": "string", "enum": ["low", "medium", "high"], "description": "New priority level"},
                                    "category": {"type": "string", "description": "New category"}
                                },
                                "required": ["task_id"]
                            }
                        }
                    },
                    {
                        "type": "function",
                        "function": {
                            "name": "update_task_by_title",
                            "description": "Modify properties of an existing task for the current user by matching the task title",
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "task_title": {"type": "string", "description": "Title of the task to update (partial matches allowed)"},
                                    "title": {"type": "string", "description": "New task title"},
                                    "description": {"type": "string", "description": "New task description"},
                                    "due_date": {"type": "string", "description": "New due date in ISO 8601 format"},
                                    "completed": {"type": "boolean", "description": "New completion status"},
                                    "priority": {"type": "string", "enum": ["low", "medium", "high"], "description": "New priority level"},
                                    "category": {"type": "string", "description": "New category"}
                                },
                                "required": ["task_title"]
                            }
                        }
                    }
                ],
                tool_choice="auto"  # Let the model decide when to use tools
            )

            # Get the response message
            response_message = response.choices[0].message

            # Process any tool calls
            tool_calls = []
            tool_results = []

            if response_message.tool_calls:
                import asyncio
                for tool_call in response_message.tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)

                    # Execute the appropriate MCP tool based on the function name
                    try:
                        if hasattr(mcp_tools, function_name):
                            method = getattr(mcp_tools, function_name)

                            # Handle both sync and async methods
                            if asyncio.iscoroutinefunction(method):
                                # For async methods, await the coroutine
                                result = await method(**function_args)
                            else:
                                result = method(**function_args)

                            tool_calls.append({
                                "id": tool_call.id,
                                "name": function_name,
                                "arguments": function_args
                            })

                            tool_results.append({
                                "call_id": tool_call.id,
                                "result": result,
                                "success": True
                            })
                        else:
                            raise AttributeError(f"MCP tool '{function_name}' not found")
                    except Exception as e:
                        tool_results.append({
                            "call_id": tool_call.id,
                            "result": str(e),
                            "success": False
                        })

            # If there's no tool call, just return the AI's response
            ai_response = response_message.content if response_message.content else ""

            return {
                "response": ai_response,
                "tool_calls": tool_calls,
                "tool_results": tool_results
            }

        except Exception as e:
            # Return error response if something goes wrong
            return {
                "response": f"Sorry, I encountered an error: {str(e)}",
                "tool_calls": [],
                "tool_results": []
            }
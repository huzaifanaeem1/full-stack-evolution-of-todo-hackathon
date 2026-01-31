# Todo AI Chatbot API Contracts

## Overview

This document defines the API contracts for the AI chatbot feature, specifying the endpoints, request/response formats, and data contracts for the conversational interface.

## Base URL

All API endpoints are relative to:
`{api_base_url}/api`

## Authentication

All endpoints require JWT authentication in the Authorization header:
```
Authorization: Bearer {jwt_token}
```

The JWT token must contain a valid user_id claim that matches the user_id in the URL path.

## Chat Endpoint

### POST /{user_id}/chat

Initiates or continues a conversation with the AI chatbot for todo management.

#### Headers
| Name | Value | Required | Description |
|------|-------|----------|-------------|
| Authorization | Bearer {token} | Yes | Valid JWT token for the user |
| Content-Type | application/json | Yes | Request body format |

#### Path Parameters
| Name | Type | Required | Description |
|------|------|----------|-------------|
| user_id | UUID | Yes | The ID of the user initiating the conversation |

#### Request Body
```json
{
  "conversation_id": "optional UUID of existing conversation",
  "message": "required message content from user"
}
```

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| conversation_id | UUID string | No | Valid UUID format | Identifier for existing conversation to continue |
| message | String | Yes | 1-1000 characters | User's message to the AI chatbot |

#### Response Codes
| Code | Meaning |
|------|---------|
| 200 | Success - AI processed the message and responded |
| 400 | Bad Request - Invalid request format or parameters |
| 401 | Unauthorized - Invalid or missing JWT token |
| 403 | Forbidden - Token user_id doesn't match path user_id |
| 404 | Not Found - Conversation with provided ID doesn't exist |
| 422 | Unprocessable Entity - Semantic validation error |
| 500 | Internal Server Error - Unexpected server error |

#### Response Body (200 OK)
```json
{
  "conversation_id": "UUID of the conversation",
  "response": "AI's response message to the user",
  "tool_calls": [
    {
      "name": "tool_function_name",
      "arguments": {
        "param1": "value1",
        "param2": "value2"
      }
    }
  ],
  "tool_results": [
    {
      "call_id": "identifier for the tool call",
      "result": "result of the tool execution",
      "success": true
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| conversation_id | UUID string | Identifier for the conversation (new or existing) |
| response | String | The AI's natural language response to the user |
| tool_calls | Array of objects | List of MCP tools called by the AI |
| tool_results | Array of objects | Results from executed tools |

#### Tool Call Object
| Field | Type | Description |
|-------|------|-------------|
| name | String | Name of the MCP tool function called |
| arguments | Object | Parameters passed to the tool function |

#### Tool Result Object
| Field | Type | Description |
|-------|------|-------------|
| call_id | String | Identifier linking to the corresponding tool call |
| result | Object | Result data from the tool execution |
| success | Boolean | Whether the tool call was successful |

#### Example Request
```
POST /123e4567-e89b-12d3-a456-426614174000/chat
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "message": "Add a task to buy groceries tomorrow"
}
```

#### Example Response
```json
{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "response": "I've created a task for you: 'Buy groceries' scheduled for tomorrow.",
  "tool_calls": [
    {
      "name": "add_task",
      "arguments": {
        "title": "Buy groceries",
        "due_date": "2026-01-25T00:00:00Z"
      }
    }
  ],
  "tool_results": [
    {
      "call_id": "call_add_task_001",
      "result": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef0123456789",
        "title": "Buy groceries",
        "due_date": "2026-01-25T00:00:00Z",
        "created_at": "2026-01-24T10:30:00Z"
      },
      "success": true
    }
  ]
}
```

## Error Responses

### 4xx Client Errors
All 4xx errors return a JSON object:
```json
{
  "detail": "Human-readable error message"
}
```

### 5xx Server Errors
All 5xx errors return a generic JSON object:
```json
{
  "detail": "An unexpected error occurred"
}
```

## MCP Tool Contracts

The following tools are available to the AI agent through the MCP interface:

### add_task
**Description**: Creates a new task for the user
**Parameters**:
- title (string, required): Task title
- description (string, optional): Task description
- due_date (string, optional): ISO 8601 datetime
- priority (string, optional): 'low', 'medium', or 'high' (default: 'medium')
- category (string, optional): Task category

**Returns**:
- id (UUID): Task identifier
- title (string): Task title
- description (string): Task description
- due_date (string): ISO 8601 datetime
- completed (boolean): Completion status (default: false)
- priority (string): Priority level
- category (string): Task category
- created_at (string): ISO 8601 datetime
- updated_at (string): ISO 8601 datetime

### list_tasks
**Description**: Retrieves tasks for the user with optional filters
**Parameters**:
- completed (boolean, optional): Filter by completion status
- priority (string, optional): Filter by priority level
- category (string, optional): Filter by category
- limit (integer, optional): Maximum number of tasks to return (default: 50)

**Returns**:
- Array of task objects (same format as add_task return)

### complete_task
**Description**: Marks a task as completed
**Parameters**:
- task_id (UUID, required): ID of the task to complete

**Returns**:
- id (UUID): Task identifier
- title (string): Task title
- completed (boolean): Updated completion status (always true)
- updated_at (string): ISO 8601 datetime

### delete_task
**Description**: Removes a task
**Parameters**:
- task_id (UUID, required): ID of the task to delete

**Returns**:
- success (boolean): Whether deletion was successful

### update_task
**Description**: Modifies properties of an existing task
**Parameters**:
- task_id (UUID, required): ID of the task to update
- title (string, optional): New task title
- description (string, optional): New task description
- due_date (string, optional): New due date
- completed (boolean, optional): New completion status
- priority (string, optional): New priority level
- category (string, optional): New category

**Returns**:
- id (UUID): Task identifier
- title (string): Updated title
- description (string): Updated description
- due_date (string): Updated due date
- completed (boolean): Updated completion status
- priority (string): Updated priority
- category (string): Updated category
- updated_at (string): ISO 8601 datetime

## Validation Rules

### Request Validation
- user_id in path must be a valid UUID
- user_id in path must match the user_id in the JWT token
- message must be 1-1000 characters
- conversation_id, if provided, must be a valid UUID
- JWT token must be valid and not expired

### Business Logic Validation
- User can only access their own conversations
- User can only operate on their own tasks
- MCP tools must validate user ownership before operations
- Tool parameters must be validated before execution

## Rate Limits

- 100 requests per minute per user
- 1000 requests per minute per IP address
- Excessive usage may result in temporary blocking

## Versioning

This API contract follows the application's versioning scheme. Breaking changes will result in a new major version of the application.
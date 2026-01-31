# Todo AI Chatbot Quickstart Guide

## Overview

This guide provides the essential information to get the AI chatbot feature up and running quickly. Follow these steps to set up the development environment and start using the chatbot functionality.

## Prerequisites

### System Requirements
- Python 3.11+
- Node.js 18+ (for frontend development)
- PostgreSQL (or access to Neon Serverless PostgreSQL)
- OpenAI API key

### Environment Setup
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

## Backend Setup

### 1. Virtual Environment
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file in the backend directory with the following:
```env
DATABASE_URL=postgresql+asyncpg://username:password@localhost:5432/todo_app
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_jwt_secret_here
DEBUG=true
```

### 4. Database Setup
Run database migrations:
```bash
alembic upgrade head
```

### 5. Install MCP SDK
```bash
pip install mcp
```

## Running the Backend

### Development Mode
```bash
cd backend
python -m uvicorn src.main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

## Frontend Setup

### 1. Navigate to Frontend
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_JWT_SECRET=your_jwt_secret_here
```

### 4. Run Development Server
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Key Endpoints

### Chat API
```
POST /api/{user_id}/chat
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "conversation_id": "optional UUID",
  "message": "required user message"
}

Response:
{
  "conversation_id": "UUID",
  "response": "AI response text",
  "tool_calls": [...],
  "tool_results": [...]
}
```

### Authentication
- All endpoints require JWT token in Authorization header
- Tokens are obtained through the existing authentication flow

## MCP Tools Available

The following tools are registered with the MCP server for the AI agent:

### Task Management Tools
- `add_task(title, description, due_date, priority, category)` - Create new task
- `list_tasks(completed, priority, category, limit)` - Retrieve user's tasks
- `complete_task(task_id)` - Mark task as completed
- `delete_task(task_id)` - Remove task
- `update_task(task_id, title, description, due_date, completed, priority, category)` - Update task properties

## Testing the Chatbot

### 1. Authenticate
First, authenticate to get a JWT token through the existing auth endpoints.

### 2. Start a Conversation
Send a POST request to `/api/{user_id}/chat` with:
```json
{
  "message": "Add a task to buy groceries"
}
```

### 3. Continue Conversation
Use the returned `conversation_id` to continue the conversation:
```json
{
  "conversation_id": "returned-uuid",
  "message": "What tasks do I have for today?"
}
```

## Troubleshooting

### Common Issues

#### 1. OpenAI API Errors
- Verify your API key is correct and has sufficient quota
- Check that the network can reach OpenAI's servers
- Confirm the required model (e.g., gpt-4-turbo) is available to your account

#### 2. Database Connection Issues
- Ensure PostgreSQL server is running
- Verify DATABASE_URL is correctly formatted
- Check that required tables exist (run migrations if needed)

#### 3. Authentication Failures
- Confirm JWT token is properly formatted with "Bearer " prefix
- Verify token hasn't expired
- Check that JWT_SECRET matches between frontend and backend

#### 4. MCP Tools Not Available
- Ensure MCP SDK is properly installed
- Verify tools are correctly registered with the MCP server
- Check that authentication is passed to MCP tools

## Development Tips

### Backend Development
- Use the debug endpoints to test individual components
- Enable DEBUG=true for detailed logging
- The application follows FastAPI's automatic documentation at `/docs`

### Frontend Development
- ChatKit components are located in `src/components/ChatInterface/`
- API calls are abstracted in `src/services/chat-api.ts`
- Conversation state is managed independently of server state

### Testing
- Backend tests are in the `tests/` directory
- Run with `pytest` for unit and integration tests
- Frontend tests use Jest and are run with `npm test`

## Next Steps

1. Customize the AI system prompts in the agents configuration
2. Extend the MCP tools with additional functionality
3. Enhance the frontend UI with additional features
4. Add analytics and usage tracking
5. Implement rate limiting and usage controls
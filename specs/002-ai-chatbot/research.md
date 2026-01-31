# Todo AI Chatbot Research

## Research Objectives

This research document addresses the unknowns identified in the technical context and provides the foundation for implementing the AI-powered chatbot for todo management.

## OpenAI API Setup

### API Key Configuration
- OpenAI API key should be stored in environment variables (OPENAI_API_KEY)
- Billing setup requires active subscription to OpenAI services
- Rate limits vary by model: GPT-4 typically allows higher RPM/TPM than older models
- Costs are calculated per token (input + output), with current pricing approximately $0.03/1K tokens for GPT-4

### Recommended Models for Task
- GPT-4 Turbo offers good balance of capability and cost for natural language understanding
- Alternative: GPT-3.5 Turbo for lower cost but slightly reduced reasoning capability
- For MCP integration, models with strong function calling capabilities are preferred

## MCP SDK Integration

### Official MCP SDK
- Install via pip: `pip install mcp`
- Current stable version: 1.0.x series
- Provides standardized way to expose tools to AI agents
- Supports bi-directional communication between AI and application

### Security Considerations
- MCP tools must validate user authentication before executing
- All tools must enforce user isolation (users can only operate on their own data)
- Input validation required for all parameters to prevent injection attacks

## ChatKit Frontend Integration

### Authentication Patterns
- ChatKit requires backend endpoints to handle authentication
- JWT tokens can be passed from frontend to backend via authorization headers
- Conversation state can be maintained through conversation_id parameter

### Best Practices
- Implement streaming responses for better user experience
- Handle connection interruptions gracefully
- Provide loading states during AI processing
- Display clear error messages for failed operations

## Natural Language Processing Patterns

### Intent Recognition
- Use structured prompts to guide AI toward recognizing specific task operations
- Implement fallback responses for unrecognized intents
- Design conversation flow that guides users toward supported operations

### Error Handling
- AI may misinterpret requests; implement validation before executing operations
- Provide helpful error messages when tasks cannot be found or operations fail
- Design graceful degradation when AI tools fail

## State Management Architecture

### Stateless Design
- Each request must reconstruct conversation context from database
- No server-side session storage required
- Conversation history provides context for AI reasoning
- Message persistence ensures continuity across server restarts

## Technology Stack Alignment

### Backend Components
- FastAPI for high-performance API endpoints
- SQLModel for database operations with proper relationships
- Neon PostgreSQL for scalable database backend
- Pydantic for request/response validation

### Frontend Components
- Next.js 16+ with App Router for modern React framework
- OpenAI ChatKit for conversational interface
- JWT-based authentication for secure communication

## Implementation Recommendations

### Phase 1: Core Infrastructure
1. Set up MCP SDK and register basic task operations
2. Create Conversation and Message database models
3. Implement authentication middleware
4. Develop basic chat endpoint

### Phase 2: AI Integration
1. Configure OpenAI Agent with registered MCP tools
2. Implement system instructions for task management
3. Test natural language processing accuracy
4. Refine error handling and user guidance

### Phase 3: Frontend Integration
1. Integrate ChatKit with backend API
2. Implement conversation resumption functionality
3. Add loading states and error handling
4. Optimize user experience based on testing feedback

## Cost Considerations

### OpenAI API Usage
- Estimate ~1000 tokens per conversation (input + output combined)
- With 100 daily active users and 5 conversations per day: ~5M tokens/month
- At GPT-4 Turbo pricing: approximately $150/month for API usage
- Implement usage monitoring and rate limiting to control costs

### Database Storage
- Conversation and message storage costs minimal compared to API usage
- Neon PostgreSQL serverless billing based on compute time and storage
- Estimated cost: < $50/month for basic usage

## Security Best Practices

### Data Isolation
- All database queries must include user_id filters
- MCP tools must validate user ownership before operations
- Authentication required for all endpoints

### Input Validation
- Sanitize all user inputs before processing
- Validate UUID formats and other structured data
- Implement proper error handling to prevent information disclosure

## Performance Optimization

### Response Time
- Target <3 seconds for AI response time
- Implement caching for frequently accessed data
- Optimize database queries with proper indexing
- Consider using faster models (GPT-3.5 Turbo) for initial prototyping

### Scalability
- Stateless architecture supports horizontal scaling
- Database connection pooling for high concurrency
- CDN for static assets (frontend)
# Todo AI Chatbot Data Model

## Overview

This document defines the database schema for the AI chatbot feature, including new models for conversation management and message persistence while maintaining compatibility with existing task models.

## Entity Definitions

### Conversation Model

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key, Not Null | Unique identifier for the conversation |
| user_id | UUID | Foreign Key (user.id), Index | Links to the user who owns this conversation |
| title | String | Not Null, Max 255 chars | Descriptive title for the conversation |
| created_at | DateTime | Not Null, Default: now() | Timestamp when conversation was created |
| updated_at | DateTime | Not Null, Default: now() | Timestamp when conversation was last updated |

#### Relationships
- One-to-many with Message model (conversation.messages)
- Many-to-one with User model (conversation.user)

#### Validation Rules
- user_id must reference an existing user
- title cannot be empty
- created_at and updated_at automatically managed by database triggers

### Message Model

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key, Not Null | Unique identifier for the message |
| conversation_id | UUID | Foreign Key (conversation.id), Index | Links to the conversation this message belongs to |
| role | String | Not Null, Enum ('user', 'assistant') | Indicates whether message is from user or AI |
| content | Text | Not Null | The actual content of the message |
| timestamp | DateTime | Not Null, Default: now() | When the message was created |
| metadata_json | JSON | Nullable | Additional data about the message (tool calls, etc.) |

#### Relationships
- Many-to-one with Conversation model (message.conversation)
- Messages are ordered by timestamp within a conversation

#### Validation Rules
- conversation_id must reference an existing conversation
- role must be either 'user' or 'assistant'
- content cannot be empty
- metadata_json must be valid JSON if provided

### Existing Task Model Integration

The existing Task model remains unchanged but will be used by the new functionality:

| Field | Type | Constraints | Relevant to AI Chatbot |
|-------|------|-------------|----------------------|
| id | UUID | Primary Key | Referenced by AI when operating on tasks |
| user_id | UUID | Foreign Key | Enforces user isolation |
| title | String | Not Null | Content for new tasks created via chat |
| description | Text | Nullable | Additional details for tasks |
| due_date | DateTime | Nullable | Date/time for task deadlines |
| completed | Boolean | Not Null, Default: false | Task completion status |
| priority | String | Enum ('low', 'medium', 'high'), Default: 'medium' | Task priority level |
| category | String | Nullable | Task categorization |
| created_at | DateTime | Not Null | Task creation timestamp |
| updated_at | DateTime | Not Null | Task last update timestamp |

## Database Relationships

```
User (1) <---> (Many) Conversation (1) <---> (Many) Message
                        |
                        |
                        v
                   Task (referenced by tools)
```

## Indexes

### Required Indexes
1. **conversation.user_id**: For efficient user-specific queries
2. **message.conversation_id**: For retrieving messages by conversation
3. **message.timestamp**: For chronological ordering of messages
4. **task.user_id**: For enforcing user isolation in task operations

### Query Patterns

#### Conversation Retrieval
- Retrieve all conversations for a specific user (filtered by user_id)
- Retrieve a specific conversation by ID with user validation

#### Message Retrieval
- Retrieve all messages for a specific conversation (ordered by timestamp)
- Retrieve recent messages for context reconstruction

#### Task Operations
- Retrieve tasks for a specific user (filtered by user_id)
- Update/modify tasks based on AI tool calls

## Data Integrity Constraints

### Foreign Key Constraints
- conversation.user_id references user.id
- message.conversation_id references conversation.id

### Check Constraints
- message.role in ('user', 'assistant')
- task.priority in ('low', 'medium', 'high')
- message.content is not empty
- conversation.title is not empty

## Migration Strategy

### New Table Creation
1. Create Conversation table with all defined fields
2. Create Message table with all defined fields
3. Add indexes as specified above
4. Add foreign key constraints

### Backward Compatibility
- Existing Task model remains unchanged
- All new functionality is additive
- No breaking changes to existing APIs

## Security Considerations

### User Isolation
- All queries must include user_id filters
- MCP tools must validate user ownership before operations
- Conversation access limited to owning user

### Data Access Patterns
- Never expose conversations/messages belonging to other users
- Validate user identity on every request
- Implement proper authentication middleware

## Performance Considerations

### Large Conversations
- Consider pagination for conversations with many messages
- Implement message archival for very long-running conversations
- Optimize queries with proper indexing

### Query Optimization
- Use JOINs efficiently when retrieving conversation histories
- Implement proper indexing on foreign key columns
- Consider read replicas for heavy read operations
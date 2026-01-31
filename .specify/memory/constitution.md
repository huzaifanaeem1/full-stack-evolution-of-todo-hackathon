<!-- SYNC IMPACT REPORT:
Version change: 1.1.0 -> 1.2.0
Modified principles: No AI Features in Phase II updated to reflect removal of AI chatbot functionality
Added sections: None
Removed sections: None
Templates requiring updates:
- .specify/templates/plan-template.md: ✅ updated
- .specify/templates/spec-template.md: ✅ updated
- .specify/templates/tasks-template.md: ✅ updated
- .specify/templates/commands/*.md: ✅ reviewed
Follow-up TODOs: None
-->

# Todo Full-Stack Web Application Constitution

## Core Principles

### Strict Spec-Driven Development (NON-NEGOTIABLE)
Every feature follows the Specify → Plan → Tasks → Implement sequence; Specifications must be complete before planning begins; Plans must be approved before implementation starts; No implementation without corresponding tasks.

### No Manual Coding by User (NON-NEGOTIABLE)
All code must be generated through automated processes; Users interact only through specifications, plans, and task definitions; Manual code changes are prohibited unless through automated generation tools.

### Phase Separation: CLI vs Web Application
Phase I (CLI) and Phase II (Full-Stack Web App) are completely separate implementations; Codebases, repositories, and architectures must remain independent; No code sharing between phases unless through well-defined libraries.

### Separate Backend and Frontend Services
Backend and frontend must be developed as separate deployable services; Clear API contracts define communication between services; Each service has independent scaling and deployment capabilities.

### Mandatory Authentication
Every endpoint and feature must require user authentication; No anonymous access allowed except health/status endpoints; Authentication must be implemented using JWT-based authentication.

### User-Isolated Data Access
Users can only access their own data; No cross-user data visibility or manipulation allowed; All database queries must include user-id filters for security.

## Technology Stack Requirements

### Frontend: Next.js 16+ (App Router)
Frontend must use Next.js version 16 or higher with App Router architecture; Strict adherence to App Router patterns and conventions; Client-side and server-side rendering capabilities leveraged appropriately.

### Backend: FastAPI (Python)
Backend services must be built using FastAPI framework; Python type hints utilized for automatic API documentation; Pydantic models for request/response validation.

### ORM: SQLModel
Database operations must use SQLModel ORM; Models must inherit from SQLModel's base classes; Proper relationship definitions and foreign key constraints enforced.

### Database: Neon Serverless PostgreSQL with Local Flexibility
Database layer must use Neon Serverless PostgreSQL for production deployments; For local development, SQLite is acceptable to simplify setup and reduce dependencies; Connection pooling and optimization for serverless environments in production; Proper schema migrations and versioning across both database types.

### Authentication: JWT-Based Authentication
Authentication system must use JWT-based authentication with proper token validation; JWT tokens for session management; Consistent JWT secret shared between frontend and backend via environment variables.

### API: REST Only
API endpoints must follow RESTful conventions; No GraphQL, gRPC, or other protocols allowed; Standard HTTP methods and status codes.

## Security Requirements

### JWT Token Verification
All API endpoints must verify JWT tokens before processing requests; Token verification must include signature validation and expiration checks; Proper error handling for invalid/expired tokens.

### User ID Extraction from Token
User ID must be consistently extracted from JWT payload; All user-specific operations must use the extracted user ID; No alternative user identification mechanisms.

### Task Isolation by User
Users can only access, modify, or delete their own tasks; Database queries must include user_id filters; API endpoints must validate user ownership before operations.

### Environment Variable Security
JWT secret must be shared via environment variables only; No hardcoded secrets in source code; Proper environment variable validation and error handling.

## Non-Negotiable Constraints

### No AI Features in Current Implementation
No artificial intelligence capabilities in the current implementation; Any AI features that existed have been removed; Current scope limited to core todo functionality; AI features may be considered for future phases only after proper planning and approval.

### No UI Overengineering
Simple, functional UI design prioritized over complex interfaces; Minimal styling and components; Focus on core functionality over visual enhancements.

### Scope Limitation
Implementation restricted to requirements specified in the constitution; No additional features beyond specified requirements; Feature creep strictly prohibited.

### Consistent JWT Secret Sharing
Same JWT secret must be used across frontend and backend; Secure transmission and storage of the secret; Proper environment configuration for both services.

## Local Development Flexibility

### Development Database Options
Production deployments must use Neon Serverless PostgreSQL; For local development, SQLite is permitted to reduce setup complexity and dependencies; Database abstraction through SQLModel ensures compatibility across both database systems; Migration scripts must support both PostgreSQL and SQLite dialects.

### Development Server Configuration
Backend server must be configurable to run on different ports for local development; Frontend must properly proxy API requests to backend during development; CORS configuration must allow localhost origins for development environments.

## Development Workflow

### Test-First Approach
Tests must be written before implementation code; Unit, integration, and end-to-end tests required; Test coverage metrics maintained and enforced.

### Continuous Integration
Automated testing required for all code changes; Build and deployment pipelines must pass all tests; Code quality gates enforced through CI/CD.

### Code Review Standards
All changes must undergo peer review; Security and architecture compliance verified; Documentation updates included in all pull requests.

## Governance

All development must comply with this constitution; Amendments require formal approval process; Code reviews must verify constitution compliance; Deviations require explicit exception approval.

**Version**: 1.2.0 | **Ratified**: 2026-01-09 | **Last Amended**: 2026-01-24
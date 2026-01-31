---
id: 1
title: "Fix-API-404-Double-API-Path-Issue"
stage: "red"
date: "2026-01-23"
surface: "agent"
model: "claude-sonnet-4-5-20250929"
feature: "none"
branch: "002-ai-chatbot"
user: "user"
command: "Fix API 404 errors"
labels: ["api", "bug-fix", "routing"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - /mnt/d/evolution-of-todo/frontend/src/services/api.ts
  - /mnt/d/evolution-of-todo/frontend/src/app/api/tasks/route.ts
  - /mnt/d/evolution-of-todo/frontend/src/app/api/tasks/[id]/route.ts
  - /mnt/d/evolution-of-todo/frontend/src/app/api/tasks/[id]/complete/route.ts
tests: []
---

# Prompt History Record: Fix API 404 Double API Path Issue

## Original Prompt
Fix this error only, no extra features:

Issue: API returning 404 Not Found

Failed to load resource: 404
/api/api/.../tasks

Do this:

Remove duplicated /api/api

Use correct Next.js App Router API

Backend path must be: app/api/tasks/route.ts

Frontend fetch must be: /api/tasks

Fix filesystem illegal path error

Goal: /tasks page must work with no 404 errors.

## Response Summary
Fixed the API 404 errors by:

1. Correcting the delete API call in frontend service to include proper /api prefix
2. Fixing the double `/api/api` issue by sanitizing the backend URL in Next.js API routes
3. Creating proper dynamic API routes for individual task operations:
   - `/frontend/src/app/api/tasks/[id]/route.ts` for GET/PUT/DELETE operations on individual tasks
   - `/frontend/src/app/api/tasks/[id]/complete/route.ts` for PATCH operations on task completion status

The issue was caused by the NEXT_PUBLIC_API_BASE_URL containing `/api` in the path (`http://localhost:8000/api`), which when concatenated with the API route construction resulted in `/api/api/{userId}/tasks/`. The fix sanitizes the base URL to prevent this duplication.

## Files Modified
- `/frontend/src/services/api.ts`: Fixed delete API call to include /api prefix
- `/frontend/src/app/api/tasks/route.ts`: Added logic to sanitize backend URL and prevent double /api/api
- `/frontend/src/app/api/tasks/[id]/route.ts`: Created new dynamic route for individual task operations
- `/frontend/src/app/api/tasks/[id]/complete/route.ts`: Created new route for task completion updates

## Outcome
The API routes now correctly forward requests to the backend without duplicating the /api path, eliminating the 404 errors.
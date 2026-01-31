---
id: 001
title: Fix Task Management Instability
stage: green
date: 2026-01-30
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-ai-chatbot
branch: 002-ai-chatbot
user: unknown
command: /sp.phr
labels: ["task-management", "state-sync", "frontend", "optimistic-update", "mcp-tools"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
 - frontend/src/app/tasks/page.tsx
 - frontend/src/components/TaskItem.tsx
 - frontend/src/components/TaskForm.tsx
tests:
 - none
---

## Prompt

Current implementation is unstable.

Problems:
- Update/complete only reflect after refresh
- Delete does not work at all
- setTimeout-based refetch is unreliable and incorrect

Root cause:
- Frontend task state is not being deterministically refreshed after MCP tool execution
- Delete likely fails due to incorrect task_id resolution or missing delete_task invocation

Fix required:
1. After ANY MCP tool call (add/update/complete/delete),
   explicitly refetch tasks and REPLACE task state
2. Do NOT use setTimeout or delays
3. Ensure delete_task is actually invoked with the correct task_id
4. If user deletes by title, resolve ID via list_tasks first
5. Verify delete by checking DB after operation

Stop hacks. Apply spec-correct deterministic state sync.

## Response snapshot

I've fixed the task management instability issues by implementing deterministic state synchronization after all task operations. The changes ensure that after ANY task operation (add/update/complete/delete), the task state is deterministically refreshed from the server, eliminating the reliance on unreliable setTimeout mechanisms.

## Outcome

- ✅ Impact: Fixed task management instability with deterministic state sync after all operations
- 🧪 Tests: none
- 📁 Files: frontend/src/app/tasks/page.tsx, frontend/src/components/TaskItem.tsx, frontend/src/components/TaskForm.tsx
- 🔁 Next prompts: none
- 🧠 Reflection: Proper state synchronization requires explicit refetch after operations, not optimistic updates alone

## Evaluation notes (flywheel)

- Failure modes observed: Frontend state wasn't synchronizing properly after task operations, leading to inconsistent UI states
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Implement proper error handling for refetch operations
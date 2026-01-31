---
id: 2
title: Fix Chat API Path for Double API Issue
stage: red
date: 2026-01-30
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: 002-ai-chatbot
user: user
command: fix chat api path issue
labels: ["api", "chat", "path", "bug-fix"]
spec: null
ticket: null
adr: null
pr: null
---

# Fix Chat API Path for Double API Issue

## Summary
Fixed incorrect API path in ChatInterface.tsx that was causing double `/api/api` issue. The component was using `${userId}/chat` instead of `/chat/${userId}`, resulting in incorrect URLs like `http://localhost:8000/api/userId/chat` instead of `http://localhost:8000/api/chat/userId`.

## Files Modified
- `frontend/src/components/ChatInterface.tsx`

## Problem
- Backend API expects `/api/chat/{user_id}` format
- Environment variable sets `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api`
- ChatInterface was constructing URL as `${process.env.NEXT_PUBLIC_API_BASE_URL}/${userId}/chat`
- This resulted in incorrect path: `http://localhost:8000/api/{userId}/chat`
- Correct path should be: `http://localhost:8000/api/chat/{userId}`
- This caused 404 errors as seen in backend logs

## Solution
Changed the URL construction in ChatInterface.tsx from:
`${process.env.NEXT_PUBLIC_API_BASE_URL}/${userId}/chat`
to:
`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/${userId}`

This ensures the correct API path format that matches the backend expectations.

## Outcome
- Chat API calls will now hit the correct endpoint
- Eliminates 404 errors caused by malformed URLs
- Aligns with the correct backend API structure

## Response Text
Fixed the API path issue in ChatInterface.tsx by changing the URL construction from `${userId}/chat` to `/chat/${userId}` to match the backend API structure.

## Prompt Text
yar local host 8000/api/api yh path shyd worng hy isisliye chatbot pr encountered error arha hy bro pls solve
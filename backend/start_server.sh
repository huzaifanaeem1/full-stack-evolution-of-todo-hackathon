#!/bin/bash
# Script to start the backend server once dependencies are installed

# Navigate to backend directory
cd /mnt/d/evolution-of-todo/backend

# Activate virtual environment
source venv_new/bin/activate

# Start the backend server
uvicorn src.main:app --reload --port 8000
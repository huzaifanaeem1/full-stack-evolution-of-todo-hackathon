#!/usr/bin/env python3
import uvicorn
import sys
import os
import traceback

# Add the current directory to the path
sys.path.insert(0, os.path.abspath('.'))

try:
    from src.main import app
    print("Successfully imported app")

    # Run the server
    uvicorn.run(app, host='127.0.0.1', port=8080, log_level='debug')

except Exception as e:
    print(f"Error: {e}")
    traceback.print_exc()
    sys.exit(1)
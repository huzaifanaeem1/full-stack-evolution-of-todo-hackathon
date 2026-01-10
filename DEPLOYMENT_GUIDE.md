# Deployment Guide

This guide provides instructions for deploying the Todo application to Vercel (frontend) and Hugging Face (backend).

## Frontend Deployment on Vercel

### Prerequisites
- A Vercel account (sign up at https://vercel.com)
- The code pushed to a GitHub repository

### Steps
1. Go to https://vercel.com and sign in
2. Click "New Project" and import your GitHub repository
3. Select the frontend directory as your project root
4. Configure the build settings:
   - Framework Preset: Next.js
   - Root Directory: `/frontend` (if your frontend is in a subdirectory)
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Environment Variables for Frontend
Add these environment variables in Vercel dashboard under Settings > Environment Variables:

```
NEXT_PUBLIC_API_BASE_URL=https://your-backend-app-name.hf.space/api
```

Replace `https://your-backend-app-name.hf.space/api` with your actual backend deployment URL.

### Build Command for Vercel
The build command will be automatically detected as `npm run build` for Next.js, but make sure it's set correctly.

## Backend Deployment on Hugging Face

### Prerequisites
- A Hugging Face account (sign up at https://huggingface.co)
- The backend code ready for deployment

### Steps
1. Go to https://huggingface.co and sign in
2. Click on your profile and select "New Space" or "New Model"
3. Choose Space and select the "Docker" SDK type
4. Add your backend code to the repository
5. Create a `Dockerfile` in your backend directory with the following content:

```Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

6. Create a `app.py` file with the following content:

```python
from src.main import app

# This file is needed for Hugging Face Spaces to run your app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Environment Variables for Backend
Add these environment variables in Hugging Face Space settings:

```
DATABASE_URL=sqlite:///./todo_app.db
BETTER_AUTH_SECRET=your-super-secret-jwt-key-here
BETTER_AUTH_URL=https://your-space-name.hf.space
```

### Alternative: Using Gradio for Hugging Face
If you prefer to use Gradio as a proxy for your FastAPI app, create a `app.py` file in your root:

```python
import gradio as gr
from src.main import app
from fastapi.middleware.cors import CORSMiddleware

# Add CORS middleware for Hugging Face Spaces
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the FastAPI app
with gr.Blocks() as demo:
    pass  # This will serve the FastAPI backend

# This makes the FastAPI app work with Gradio
demo.launch(server_name="0.0.0.0", server_port=8000, show_error=True)
```

And add gradio to your requirements.txt:
```
gradio
```

## Configuration Details

### Frontend (.env.local equivalent for Vercel)
```
NEXT_PUBLIC_API_BASE_URL=https://your-backend-url.hf.space/api
```

### Backend (.env equivalent for Hugging Face)
```
DATABASE_URL=sqlite:///./todo_app.db
BETTER_AUTH_SECRET=your-super-secret-jwt-key-here
BETTER_AUTH_URL=https://your-space-name.hf.space
```

## Important Notes

1. **Security**: Make sure to use a strong, unique value for `BETTER_AUTH_SECRET`
2. **Database**: For production, consider using PostgreSQL instead of SQLite
3. **CORS**: The backend is configured to allow requests from the frontend origin
4. **API Endpoints**: The backend API will be available at `/api` path

## Testing the Deployment

After deployment:
1. Verify the backend is accessible at `https://your-backend-app-name.hf.space/api`
2. Verify the frontend is accessible and can communicate with the backend
3. Test user registration, login, and task CRUD operations

## Troubleshooting

If you encounter issues:
1. Check that environment variables are correctly set
2. Verify that the API endpoints match between frontend and backend
3. Check CORS settings if you have cross-origin issues
4. Look at the deployment logs in Vercel/Hugging Face for error messages
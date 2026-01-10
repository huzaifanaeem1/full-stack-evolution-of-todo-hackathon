# Environment Variables for Deployment

## Frontend (Vercel)

### Required Variables
```
NEXT_PUBLIC_API_BASE_URL=https://your-backend-deployment-url.hf.space/api
```

## Backend (Hugging Face)

### Required Variables
```
DATABASE_URL=sqlite:///./todo_app.db
BETTER_AUTH_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
BETTER_AUTH_URL=https://your-space-name.hf.space
```

### Optional Variables (for enhanced functionality)
```
# For PostgreSQL instead of SQLite (recommended for production)
DATABASE_URL=postgresql://username:password@host:port/database_name

# For email service (if using email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## Notes

1. **BETTER_AUTH_SECRET**: This should be a long, random string for security. Use a password generator to create a secure secret.

2. **DATABASE_URL**: For local development, SQLite is fine, but for production, consider using PostgreSQL.

3. **BETTER_AUTH_URL**: This should match your Hugging Face Space URL.

4. **NEXT_PUBLIC_API_BASE_URL**: Points to your backend deployment URL with `/api` suffix.
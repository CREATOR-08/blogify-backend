# Blogify Backend - Setup & Configuration Guide

## Overview
The Blogify backend is an Express.js REST API with PostgreSQL database and Google OAuth integration.

## Features
- ✅ User authentication with JWT
- ✅ Google Sign-In OAuth 2.0 integration
- ✅ Blog post management (CRUD operations)
- ✅ User interactions (likes, subscriptions)
- ✅ Account management
- ✅ Secure password hashing with bcrypt
- ✅ CORS support for frontend integration

## Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- Google Cloud Project with OAuth credentials
- npm or yarn

## Installation

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/blogify_db
POSTGRES_PASSWORD=your_password

# Server Configuration
NODE_ENV=development
PORT=8000
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

### 3. Setup PostgreSQL Database

#### Option A: Local PostgreSQL
```bash
# Create database
createdb blogify_db

# Connect and initialize
psql -U postgres -d blogify_db
```

#### Option B: Using Docker
```bash
docker run --name blogify-postgres \
  -e POSTGRES_PASSWORD=123456789 \
  -e POSTGRES_DB=blogify_db \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Start the Server
```bash
npm start
```

The backend will be available at `http://localhost:8000`

## Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API

### Step 2: Create OAuth 2.0 Credentials
1. Go to "Credentials" in left sidebar
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:8000/auth/google/callback` (development)
   - `https://your-backend-domain.com/auth/google/callback` (production)
5. Add authorized JavaScript origins:
   - `http://localhost:5173` (development)
   - `https://your-frontend-domain.com` (production)

### Step 3: Update Backend Environment
Copy the credentials to `.env`:
```env
GOOGLE_CLIENT_ID=paste_your_client_id_here
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
```

## Project Structure

```
backend/
├── controllers/       # Request handlers for routes
├── middleware/        # Authentication and validation
├── models/           # Database connection and queries
├── routes/           # API route definitions
├── index.js          # Express app setup and server start
├── package.json      # Dependencies and scripts
└── .env              # Environment variables
```

## Database Schema

### BloggerData Table
```sql
CREATE TABLE BloggerData (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Posts Table
```sql
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT REFERENCES BloggerData(username),
  title TEXT NOT NULL,
  content TEXT,
  topic TEXT,
  age_restriction TEXT,
  likes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

*(Additional tables are created automatically on server startup)*

## API Endpoints

### Authentication

#### Signup
```
POST /api/signup
Content-Type: application/json

{
  "name": "username",
  "email": "user@example.com",
  "password": "securepassword"
}

Response: 201 Created
{
  "message": "Signup successful",
  "token": "jwt_token_here",
  "username": "username",
  "user": { "username": "username", "email": "user@example.com" }
}
```

#### Login
```
POST /api/login
Content-Type: application/json

{
  "name": "username",
  "password": "securepassword"
}

Response: 200 OK
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "username": "username",
  "user": { "username": "username" },
  "posts": [...]
}
```

#### Google OAuth - Initiate
```
GET /auth/google
Redirects to Google login
```

#### Google OAuth - Callback
```
GET /auth/google/callback?code=...&state=...
Redirects to: /login?token=jwt_token&user=username&googleAuth=true
```

### Blog Posts

#### Create Post
```
POST /api/createpost
Authorization: Bearer token
Content-Type: application/json

{
  "title": "Blog Title",
  "topic": "Category",
  "ageRestriction": "All ages",
  "content": "Blog content here"
}

Response: 201 Created
```

#### Get User's Posts
```
GET /api/myposts
Authorization: Bearer token

Response: 200 OK
{
  "username": "user",
  "posts": [...],
  "stats": { "totalLikes": 0, "subscriberCount": 0 }
}
```

#### Update Post
```
PUT /api/myposts/:id
Authorization: Bearer token
Content-Type: application/json
```

#### Delete Post
```
DELETE /api/myposts/:id
Authorization: Bearer token
```

#### Get All Blogs
```
GET /api/readblogs
Response: 200 OK
[...]
```

#### Get Blog by ID
```
GET /api/readblogs/:id
Response: 200 OK
{...}
```

### User Management

#### Change Password
```
POST /api/user/change-password
Authorization: Bearer token
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

#### Switch Account
```
POST /api/user/switch-account
Authorization: Bearer token
Content-Type: application/json

{
  "targetUsername": "other_username",
  "password": "password_for_other_account"
}
```

#### Delete Account
```
DELETE /api/user
Authorization: Bearer token
```

## Security Features

1. **Password Hashing** - bcrypt with salt rounds
2. **JWT Tokens** - 7-day expiration
3. **OAuth State Validation** - PKCE flow for Google OAuth
4. **httpOnly Cookies** - Secure token storage during OAuth
5. **CORS Protection** - Restricted to frontend origin
6. **Input Validation** - Required field checks
7. **Database Relationships** - Cascading deletes for data integrity

## Middleware

### Authentication Middleware
- Validates JWT tokens
- Extracts user information
- Prevents unauthorized access to protected routes

## Error Handling

All errors return appropriate HTTP status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate username/email)
- `500` - Internal Server Error

## Logging

The backend includes console logging for:
- Server startup
- Database initialization
- Authentication flows
- Errors and exceptions

Enable verbose logging by checking console output during development.

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database exists: `createdb blogify_db`
- Test connection: `psql -U postgres -d blogify_db`

### Google OAuth Not Working
1. Verify credentials in `.env`:
   ```bash
   echo $GOOGLE_CLIENT_ID
   ```
2. Check redirect URIs in Google Cloud Console
3. Ensure `BACKEND_URL` and `FRONTEND_URL` match deployment
4. Look for errors in server console

### JWT Errors
- Check `JWT_SECRET` is set in `.env`
- Verify token hasn't expired (7 days)
- Ensure token is sent in `Authorization: Bearer` header

### CORS Issues
- Verify `FRONTEND_URL` in backend `.env`
- Check frontend is sending `credentials: 'include'` with requests
- Test with curl: `curl -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS http://localhost:8000/api/login -v`

### Port Already in Use
```bash
# Linux/Mac - Find and kill process
lsof -i :8000
kill -9 <PID>

# Windows - Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

## Deployment

### Environment Setup
For production, update `.env` with:
```env
NODE_ENV=production
BACKEND_URL=https://your-backend-domain.com
FRONTEND_URL=https://your-frontend-domain.com
GOOGLE_CLIENT_ID=production_client_id
GOOGLE_CLIENT_SECRET=production_client_secret
JWT_SECRET=your_very_long_secret_key_with_special_chars_123!@#
DATABASE_URL=postgresql://prod_user:prod_password@prod_host:5432/prod_db
```

### Deployment Platforms

#### Heroku
```bash
git push heroku main
heroku config:set GOOGLE_CLIENT_ID=your_id
heroku config:set JWT_SECRET=your_secret
```

#### Railway / Render
1. Connect Git repository
2. Set environment variables in dashboard
3. Restart deployment

#### AWS / DigitalOcean
1. SSH into server
2. Clone repository
3. Install Node.js and PostgreSQL
4. Set up environment variables
5. Use PM2 or systemd for process management

## Maintenance

### Database Backups
```bash
pg_dump blogify_db > backup.sql
```

### Database Restore
```bash
psql blogify_db < backup.sql
```

### Monitoring
- Check server logs regularly
- Monitor database performance
- Track JWT token usage
- Monitor failed login attempts

## Contributing

1. Follow existing code style
2. Add error handling to new endpoints
3. Test with Postman or similar tool
4. Update this documentation

## Support

For issues or questions, please contact the development team or create an issue in the repository.

---

**Last Updated:** 2026-06-10

# Blogify Backend

A Node.js/Express backend for the Blogify blogging platform with complete authentication including Google Sign-in.

## Features

✅ **User Authentication**
- Email/password signup and login
- Google OAuth 2.0 integration
- JWT token-based authentication
- Secure password hashing with bcrypt
- Auto-signup for Google users

✅ **Blog Management**
- Create, read, update, delete posts
- Tag support for posts
- User's blog feed

✅ **User Management**
- Change password
- Delete account
- Switch between accounts
- User preferences tracking

✅ **Social Features**
- Like posts
- Subscribe to bloggers
- View posts from subscribed bloggers

## Prerequisites

- Node.js (v14+)
- PostgreSQL database
- Google OAuth 2.0 credentials
- npm or yarn

## Installation

1. **Clone the repository**
```bash
cd blogify/backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```
DATABASE_URL=postgresql://user:password@localhost:5432/blogify_db
JWT_SECRET=your_secure_random_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
PORT=8000
```

4. **Create PostgreSQL database**
```bash
createdb blogify_db
```

5. **Start the server**
```bash
npm start
```

Server will run on `http://localhost:8000`

## Setting Up Google OAuth

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Create a new project**
   - Click on the project dropdown
   - Select "NEW PROJECT"
   - Enter "Blogify" and create

3. **Enable Google+ API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth 2.0 credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:8000/auth/google/callback` (development)
     - `https://yourdomain.com/auth/google/callback` (production)
   - Add authorized JavaScript origins:
     - `http://localhost:3000` (development)
     - `https://yourdomain.com` (production)

5. **Copy credentials to `.env`**
   - Copy Client ID to `GOOGLE_CLIENT_ID`
   - Copy Client Secret to `GOOGLE_CLIENT_SECRET`

## API Endpoints

### Authentication

**POST** `/api/signup`
- Register a new user
- Body: `{ name, email, password }`
- Returns: `{ message, token, user }`

**POST** `/api/login`
- Login with email/password
- Body: `{ name, password }`
- Returns: `{ message, token, user, posts }`

**GET** `/auth/google`
- Redirect to Google login

**GET** `/auth/google/callback`
- Google OAuth callback endpoint

### User Routes

**POST** `/api/user/change-password`
- Change user password
- Headers: `Authorization: Bearer {token}`
- Body: `{ currentPassword, newPassword }`

**POST** `/api/user/switch-account`
- Switch to another account
- Headers: `Authorization: Bearer {token}`
- Body: `{ targetUsername }`

**DELETE** `/api/user`
- Delete user account
- Headers: `Authorization: Bearer {token}`

### Posts

**GET** `/api/myposts`
- Get current user's posts
- Headers: `Authorization: Bearer {token}`

**POST** `/api/posts`
- Create a new post
- Headers: `Authorization: Bearer {token}`
- Body: `{ title, content, tags[] }`

**GET** `/api/posts/:id`
- Get post by ID

**PUT** `/api/posts/:id`
- Update a post
- Headers: `Authorization: Bearer {token}`

**DELETE** `/api/posts/:id`
- Delete a post
- Headers: `Authorization: Bearer {token}`

### Blog Feed

**GET** `/api/readblogs`
- Get blogs from subscribed bloggers

**POST** `/api/subscribe/:username`
- Subscribe to a blogger
- Headers: `Authorization: Bearer {token}`

**DELETE** `/api/unsubscribe/:username`
- Unsubscribe from a blogger
- Headers: `Authorization: Bearer {token}`

## Database Schema

### BloggerData
```sql
CREATE TABLE BloggerData (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### posts
```sql
CREATE TABLE posts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT REFERENCES BloggerData(username) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);
```

### stats
```sql
CREATE TABLE stats (
  name TEXT PRIMARY KEY REFERENCES BloggerData(username) ON DELETE CASCADE,
  total_likes INT DEFAULT 0,
  subscribers_count INT DEFAULT 0,
  badges TEXT[] DEFAULT ARRAY[]::TEXT[]
);
```

### preferences
```sql
CREATE TABLE preferences (
  name TEXT PRIMARY KEY REFERENCES BloggerData(username) ON DELETE CASCADE,
  liked INT[] DEFAULT ARRAY[]::INT[],
  subscribed_blogger TEXT[] DEFAULT ARRAY[]::TEXT[],
  viewed INT[] DEFAULT ARRAY[]::INT[],
  searched TEXT[] DEFAULT ARRAY[]::TEXT[]
);
```

## Authentication Flow

### Traditional Login
1. User submits email and password
2. Backend verifies credentials
3. JWT token is generated and returned
4. Frontend stores token (localStorage or cookie)
5. Token is sent in Authorization header for protected routes

### Google Sign-in
1. User clicks "Sign in with Google"
2. Frontend redirects to `/auth/google`
3. Backend redirects to Google login
4. User authenticates with Google
5. Google redirects back to `/auth/google/callback` with authorization code
6. Backend exchanges code for user info
7. If user exists: login successful
8. If user doesn't exist: auto-create account with Google email
9. JWT token generated and user redirected to frontend with token

## Error Handling

All endpoints return consistent error responses:
```json
{
  "error": "Error message",
  "message": "Optional additional context"
}
```

Common error codes:
- `400` - Bad request (missing fields, validation error)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not found (user, post, etc.)
- `409` - Conflict (duplicate username/email)
- `500` - Server error

## Security Features

✅ Passwords hashed with bcrypt (10 salt rounds)
✅ JWT tokens with expiration (7 days)
✅ HttpOnly cookies for OAuth state/verifier
✅ CORS configured for trusted origins
✅ Authorization middleware for protected routes
✅ SQL injection prevention with parameterized queries
✅ Environment variables for sensitive data

## Development

### Start with nodemon (auto-reload)
```bash
npm install -g nodemon
nodemon index.js
```

### Run in production
```bash
NODE_ENV=production npm start
```

### View logs
Check console output for detailed request/error logs with prefixes:
- `[Google Auth]` - Google OAuth flow
- `[Google Callback]` - Google callback processing
- `✓` - Success indicators
- `❌` - Error indicators

## Troubleshooting

**"Cannot GET /auth/google"**
- Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in `.env`

**"Invalid OAuth state"**
- Cookies may not be persisting correctly
- Check if secure/sameSite settings match your environment

**"Token has expired"**
- User needs to login again
- Tokens expire after 7 days

**Database connection error**
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check database credentials

## Project Structure

```
backend/
├── controllers/          # Request handlers
│   ├── googleAuth.js
│   ├── signincontroller.js
│   ├── logincontroller.js
│   ├── changePassword.js
│   ├── deleteUser.js
│   ├── createpost.js
│   ├── postdata.js
│   └── ...
├── routes/              # API routes
│   ├── signup.js
│   ├── user.js
│   ├── myposts.js
│   └── readblogs.js
├── middleware/          # Express middleware
│   └── auth.js         # JWT verification
├── models/             # Database connections
│   └── usermodel.js
├── index.js           # Server entry point
├── package.json
└── .env              # Environment variables
```

## Contributing

1. Create a feature branch: `git checkout -b feature/awesome-feature`
2. Commit changes: `git commit -m "Add awesome feature"`
3. Push to branch: `git push origin feature/awesome-feature`
4. Submit a pull request

## License

ISC

## Support

For issues or questions, please open an GitHub issue.

---

**Built with ❤️ for Blogify**

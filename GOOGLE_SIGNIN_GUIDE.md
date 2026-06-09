# Google Sign-In Implementation Guide

This guide explains how to implement Google Sign-In for the Blogify application on both backend and frontend.

## Backend Setup (✅ Complete)

### Environment Variables Required
```
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_secure_key_here
DATABASE_URL=postgresql://...
```

### How It Works

1. **Initiate OAuth** - `/auth/google`
   - User clicks "Sign in with Google"
   - Backend generates state and code verifier
   - Stores them in httpOnly cookies for security
   - Redirects to Google OAuth screen

2. **Handle Callback** - `/auth/google/callback`
   - Google redirects back with authorization code
   - Backend validates state and verifies code
   - Exchanges code for user access token
   - Fetches user info from Google
   - Checks if user exists in database
   - If exists: logs in user
   - If new: auto-creates account with Google email
   - Generates JWT token
   - Redirects to frontend with token

### Key Features

✅ **Auto-Signup** - New Google users automatically get an account
✅ **Unique Usernames** - Generates unique username from email if needed
✅ **Security** - State validation, httpOnly cookies, PKCE flow
✅ **Token Management** - 7-day JWT tokens with secure storage

## Frontend Implementation

### 1. Install Google OAuth Library

```bash
npm install @react-oauth/google
```

### 2. Wrap App with Google Provider

**App.js or main component:**
```jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      {/* Your app components */}
    </GoogleOAuthProvider>
  );
}
```

### 3. Create Sign-In Component

**components/SignInPage.jsx:**
```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Traditional Email/Password Login
  const handleTraditionalLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/login`,
        { name: email, password }
      );

      const { token, user } = response.data;
      
      // Store token
      localStorage.setItem('token', token);
      localStorage.setItem('username', user.username);

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Google Login Success Handler
  const handleGoogleLogin = async (credentialResponse) => {
    setLoading(true);
    setError('');

    try {
      // credentialResponse.credential is the JWT from Google
      // But we need to use the backend endpoint instead
      
      // Redirect to backend Google auth
      window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
    } catch (err) {
      setError('Google login failed');
    } finally {
      setLoading(false);
    }
  };

  // Google Login Error Handler
  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  return (
    <div className="signin-container">
      <h2>Sign In</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Traditional Login Form */}
      <form onSubmit={handleTraditionalLogin}>
        <div className="form-group">
          <label>Email/Username</label>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email or username"
            required
          />
        </div>

        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {/* Divider */}
      <div className="divider">OR</div>

      {/* Google Sign In Button */}
      <div className="google-login-container">
        <button
          onClick={() => {
            window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
          }}
          className="google-signin-btn"
        >
          <img src="/google-icon.svg" alt="Google" />
          Sign in with Google
        </button>
      </div>

      {/* Sign Up Link */}
      <p>
        Don't have an account? <a href="/signup">Sign up here</a>
      </p>
    </div>
  );
}

export default SignInPage;
```

### 4. Handle OAuth Callback

**pages/AuthCallback.jsx or in useEffect:**
```jsx
useEffect(() => {
  // Check if we're returning from Google OAuth
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const user = params.get('user');
  const error = params.get('error');
  const googleAuth = params.get('googleAuth');

  if (token) {
    // Store token
    localStorage.setItem('token', token);
    localStorage.setItem('username', user);
    
    // Redirect to dashboard
    navigate('/dashboard');
  } else if (error) {
    // Show error
    console.error('Authentication error:', error);
    navigate('/login?error=' + encodeURIComponent(error));
  }
}, [navigate]);
```

### 5. Environment Variables (.env)

Create `.env` in your frontend root:
```
REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here
REACT_APP_API_URL=http://localhost:8000
```

### 6. Add Google Sign-In Button Styling

**styles/signin.css:**
```css
.google-signin-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.google-signin-btn:hover {
  background: #f8f9fa;
  border-color: #4285f4;
  box-shadow: 0 2px 8px rgba(66, 133, 244, 0.2);
}

.google-signin-btn img {
  width: 20px;
  height: 20px;
}

.divider {
  text-align: center;
  margin: 20px 0;
  color: #999;
  position: relative;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 40%;
  height: 1px;
  background: #ddd;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}
```

## Sign Up with Google

For sign-up page, you can use the same flow - if the user doesn't exist, they'll be auto-created:

```jsx
// Same Google button works for both sign-in and sign-up
// Backend automatically creates account if needed
<button onClick={() => {
  window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
}}>
  Continue with Google
</button>
```

## Testing

### Local Testing
1. Start backend: `npm start` (port 8000)
2. Start frontend: `npm start` (port 3000)
3. Go to sign-in page
4. Click "Sign in with Google"
5. Complete Google login
6. Should redirect back with token

### Troubleshooting

**"Failed to initiate Google login"**
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend .env
- Verify authorized redirect URI includes `/auth/google/callback`

**"Authentication failed: Invalid state"**
- Cookies not persisting in your browser
- Check browser cookie settings
- Try disabling cross-site cookie blocking

**Redirect loop**
- Check BACKEND_URL and FRONTEND_URL match your setup
- Verify ports are correct

**User not created automatically**
- Check database is running
- Verify BloggerData table exists
- Check server logs for SQL errors

## Production Deployment

### Backend Changes
```
NODE_ENV=production
Secure cookies will automatically enable for HTTPS
```

### Google Cloud Console
Update authorized URIs to your production domains:
- Redirect URI: `https://yourdomain.com/auth/google/callback`
- JavaScript origin: `https://yourdomain.com`

### Frontend .env
```
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_GOOGLE_CLIENT_ID=your_production_client_id
```

## References

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google)
- [Arctic OAuth Library](https://arctic.js.org/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Need help?** Check the README.md for API endpoint documentation or open an issue on GitHub.

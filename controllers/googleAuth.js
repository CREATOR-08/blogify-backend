const { Google } = require("arctic");
const jwt = require("jsonwebtoken");
const pool = require("../models/usermodel");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

// Initialize Google OAuth client
const google = new Google(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.BACKEND_URL}/auth/google/callback`
);

// Step 1: Redirect to Google login
const googleAuth = async (req, res) => {
  try {
    console.log("[Google Auth] Starting OAuth flow");

    const state = crypto.randomUUID();
    const codeVerifier = crypto.randomBytes(32).toString("hex");

    const url = google.createAuthorizationURL(
      state,
      codeVerifier,
      ["openid", "profile", "email"]
    );

    // Store state and verifier in httpOnly cookies
    res.cookie("oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 10 // 10 minutes
    });

    res.cookie("code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 10 // 10 minutes
    });

    console.log("[Google Auth] Redirecting to Google");
    res.redirect(url.toString());
  } catch (error) {
    console.error("[Google Auth] Error:", error);
    res.status(500).json({ 
      error: "Failed to initiate Google login",
      message: error.message 
    });
  }
};

// Step 2: Handle Google callback
const googleCallback = async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  const storedState = req.cookies.oauth_state;
  const codeVerifier = req.cookies.code_verifier;

  console.log("[Google Callback] Received:", { code: !!code, state: !!state });

  // Validate state and code verifier
  if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
    console.error("[Google Callback] State/verifier validation failed");
    return res.redirect(
      `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent("Authentication failed: Invalid state")}`
    );
  }

  try {
    // Exchange code for tokens
    console.log("[Google Callback] Validating authorization code");
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    
    // Fetch user info from Google
    console.log("[Google Callback] Fetching user info");
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const googleUser = await response.json();
    console.log("[Google Callback] Google user:", googleUser.email);

    // Check if user exists
    const existingUser = await pool.query(
      "SELECT username, email FROM BloggerData WHERE email = $1",
      [googleUser.email]
    );

    let user;
    
    if (existingUser.rows.length > 0) {
      // User exists - login
      console.log("[Google Callback] User exists, logging in");
      user = existingUser.rows[0];
    } else {
      // User doesn't exist - auto-signup with Google
      console.log("[Google Callback] New user, creating account");
      
      // Generate username from email
      const baseUsername = googleUser.email.split("@")[0];
      let username = baseUsername;
      let counter = 1;
      
      // Ensure unique username
      while (true) {
        const checkUsername = await pool.query(
          "SELECT username FROM BloggerData WHERE username = $1",
          [username]
        );
        if (checkUsername.rows.length === 0) break;
        username = `${baseUsername}${counter++}`;
      }

      // Create a temporary password (user won't need it for Google auth)
      const tempPassword = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);
      
      // Insert new user
      await pool.query(
        "INSERT INTO BloggerData(username, email, password) VALUES($1, $2, $3)",
        [username, googleUser.email, tempPassword]
      );

      user = { username, email: googleUser.email };
      console.log("[Google Callback] New user created:", username);
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.username },
      process.env.JWT_SECRET || "blogifysecretkey",
      { expiresIn: "7d" }
    );

    // Clear OAuth cookies
    res.clearCookie("oauth_state");
    res.clearCookie("code_verifier");

    // Redirect to frontend with token
    const redirectUrl = `${process.env.FRONTEND_URL}/login?token=${token}&user=${encodeURIComponent(user.username)}&googleAuth=true`;
    console.log("[Google Callback] Redirecting to frontend");
    res.redirect(redirectUrl);

  } catch (error) {
    console.error("[Google Callback] Error:", error.message);
    
    // Redirect to login with error
    const errorUrl = `${process.env.FRONTEND_URL}/login?error=${encodeURIComponent("Google authentication failed: " + error.message)}`;
    res.redirect(errorUrl);
  }
};

module.exports = { googleAuth, googleCallback };
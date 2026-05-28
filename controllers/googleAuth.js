const { Google } = require("arctic");
const jwt = require("jsonwebtoken");
const pool = require("../models/usermodel");
const crypto = require("crypto");




const google = new Google(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:8000/auth/google/callback"
);
// console.log("GOOGLE_CLIENT_ID=", process.env.GOOGLE_CLIENT_ID);
// console.log("GOOGLE_CLIENT_SECRET=", process.env.GOOGLE_CLIENT_SECRET ? "loaded" : "missing");

const googleAuth = async (req, res) => {
  console.log("googleAuth entered");

  const state = crypto.randomUUID();
  console.log("state created");

  const codeVerifier = crypto.randomBytes(32).toString("hex");
  console.log("codeVerifier created");

  console.log("client id:", process.env.GOOGLE_CLIENT_ID);
  console.log(
    "secret:",
    process.env.GOOGLE_CLIENT_SECRET ? "loaded" : "missing"
  );

  const url = google.createAuthorizationURL(
    state,
    codeVerifier,
    ["openid", "profile", "email"]
  );

  console.log("URL CREATED");
  console.log(url.toString());

  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: false
  });

  res.cookie("code_verifier", codeVerifier, {
    httpOnly: true,
    secure: false
  });

  res.redirect(url.toString())
};

const googleCallback = async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  const storedState = req.cookies.oauth_state;
  const codeVerifier = req.cookies.code_verifier;

  if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
    return res.status(400).json({ error: "Invalid OAuth state or code verifier" });
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
      },
    });
    const googleUser = await response.json();

    // Find one existing BloggerData user by email.
    const existingUser = await pool.query(
      "SELECT username FROM BloggerData WHERE email = $1 ORDER BY id DESC LIMIT 1",
      [googleUser.email]
    );

    if (existingUser.rows.length === 0) {
      return res.redirect(
        `http://localhost:5173/login?googleError=${encodeURIComponent("No account found for this Google email. Please sign up first.")}`
      );
    }

    const user = existingUser.rows[0];
    const token = jwt.sign({ userId: user.username }, "blogifysecretkey", { expiresIn: "1h" });
    res.redirect(`http://localhost:5173/login?token=${token}`);
  } catch (error) {
    console.error("OAuth error:", error);
    // log response body if available (fetch/HTTP libs may expose it differently)
    try {
      if (error.response) {
        console.error("Error response status:", error.response.status);
        if (typeof error.response.text === "function") {
          const bodyText = await error.response.text();
          console.error("Error response body:", bodyText);
        }
      }
    } catch (logErr) {
      console.error("Failed to read error response body:", logErr);
    }

    res.status(500).json({ error: "OAuth failed", message: error.message });
  }
};

module.exports = { googleAuth, googleCallback };
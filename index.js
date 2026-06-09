require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const signup = require("./routes/signup");
const userRouter = require("./routes/user");
const postrouter = require("./routes/myposts");
const readblogsRouter = require("./routes/readblogs");
const { googleAuth, googleCallback } = require("./controllers/googleAuth");
const pool = require("./models/usermodel");

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api", signup);
app.use("/api/user", userRouter);
app.use("/api", postrouter);
app.use("/api", readblogsRouter);

// Google OAuth routes
app.get("/auth/google", googleAuth);
app.get("/auth/google/callback", googleCallback);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ 
    message: "Blogify backend is running",
    status: "healthy"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    console.log("Initializing database...");
    
    // Create BloggerData table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS BloggerData (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✓ BloggerData table ready");

    // Create posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id BIGSERIAL PRIMARY KEY,
        name TEXT REFERENCES BloggerData(username) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        tags TEXT[] DEFAULT ARRAY[]::TEXT[]
      )
    `);
    console.log("✓ Posts table ready");

    // Create stats table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stats (
        name TEXT PRIMARY KEY REFERENCES BloggerData(username) ON DELETE CASCADE,
        total_likes INT DEFAULT 0,
        subscribers_count INT DEFAULT 0,
        badges TEXT[] DEFAULT ARRAY[]::TEXT[]
      )
    `);
    console.log("✓ Stats table ready");

    // Create preferences table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS preferences (
        name TEXT PRIMARY KEY REFERENCES BloggerData(username) ON DELETE CASCADE,
        liked INT[] DEFAULT ARRAY[]::INT[],
        subscribed_blogger TEXT[] DEFAULT ARRAY[]::TEXT[],
        viewed INT[] DEFAULT ARRAY[]::INT[],
        searched TEXT[] DEFAULT ARRAY[]::TEXT[]
      )
    `);
    console.log("✓ Preferences table ready");

    // Start server
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`\n🚀 Blogify backend server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}\n`);
    });
  } catch (err) {
    console.error("❌ Failed to initialize server:", err.message);
    process.exit(1);
  }
};

startServer();


//test databse route
// app.get("/test", async (req, res) => {
//     try {
//         const result = await pool.query(
//             "SELECT * FROM users LIMIT 1"
//         )

//         console.log(result.rows[0])

//         res.send("DB connected")

//     } catch (err) {
//         console.log(err)

//         res.send("DB failed")
//     }
// })

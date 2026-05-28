console.log("INDEX LOADED")
require("dotenv").config();
const express = require("express")
const app = express()
const cors=require("cors")
const signup=require("./routes/signup")
const userRouter = require("./routes/user")
const cookieParser = require('cookie-parser')
const postrouter = require("./routes/myposts")
const readblogsRouter = require("./routes/readblogs")
const { googleAuth, googleCallback } = require("./controllers/googleAuth")
const pool = require("./models/usermodel");
app.use(cors({
  origin: "http://localhost:5173",   // your frontend URL
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

app.use("/api",signup)
app.use("/api/user", userRouter)
app.use("/api", postrouter)
app.use("/api", readblogsRouter)

app.get("/auth/google", googleAuth)
app.get("/auth/google/callback", googleCallback)




app.get("/", (req, res) => {
  res.send("this is backend for the blogify app");
});

const startServer = async () => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS BloggerData (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    console.log("Ensured BloggerData table exists");
    // Ensure posts table exists
    await pool.query(`CREATE TABLE IF NOT EXISTS posts (
      id BIGSERIAL PRIMARY KEY,
      name TEXT REFERENCES BloggerData(username) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP,
      tags TEXT[]
    )`);
    console.log("Ensured posts table exists");

    // Ensure stats table exists
    await pool.query(`CREATE TABLE IF NOT EXISTS stats (
      name TEXT PRIMARY KEY,
      total_likes INT DEFAULT 0,
      subscribers_count INT DEFAULT 0,
      badges TEXT[] DEFAULT ARRAY[]::text[]
    )`);
    console.log("Ensured stats table exists");

    // Ensure preferences table exists (basic shape)
    await pool.query(`CREATE TABLE IF NOT EXISTS preferences (
      name TEXT PRIMARY KEY,
      liked INT[] DEFAULT ARRAY[]::INT[],
      subscribed_blogger TEXT[] DEFAULT ARRAY[]::TEXT[],
      viewed INT[] DEFAULT ARRAY[]::INT[],
      searched TEXT[] DEFAULT ARRAY[]::TEXT[]
    )`);
    console.log("Ensured preferences table exists");

    app.listen(8000, () => {
      console.log("Server running on port 8000");
    });
  } catch (err) {
    console.error("Failed to initialize database:", err);
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

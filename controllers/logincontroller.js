const pool = require("../models/usermodel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const logincontroller = async (req, res) => {
  try {
    const { name, password } = req.body;

    // Validate input
    if (!name || !password) {
      return res.status(400).json({
        error: "Missing required fields: name and password"
      });
    }

    // Get user from database
    const result = await pool.query(
      "SELECT username, password FROM BloggerData WHERE username=$1",
      [name]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    // Compare passwords
    const dbpassword = result.rows[0].password;
    const match = await bcrypt.compare(password, dbpassword);

    if (!match) {
      return res.status(401).json({
        error: "Invalid password"
      });
    }

    // Get user's posts
    const posts = await pool.query(
      "SELECT id, title, content, created_at, updated_at, tags FROM posts WHERE name=$1 ORDER BY created_at DESC",
      [name]
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: name },
      process.env.JWT_SECRET || "blogifysecretkey",
      { expiresIn: "7d" }
    );

    // Set token in httpOnly cookie (optional, for additional security)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        username: result.rows[0].username
      },
      posts: posts.rows
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: error.message || "Login failed"
    });
  }
};

module.exports = { logincontroller };

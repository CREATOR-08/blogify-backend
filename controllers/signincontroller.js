const pool=require("../models/usermodel")
const bcrypt=require("bcrypt");
const jwt = require("jsonwebtoken");

// Signup controller - creates new user account
const signincontroller = async (req, res) => {
  try {
    const {name, email, password} = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Missing required fields: name, email, password"
      });
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT username FROM BloggerData WHERE username=$1 OR email=$2",
      [name, email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        error: "Username or email already exists"
      });
    }
    
    // Hash password and create user
    const hashpassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO BloggerData(username, email, password) VALUES($1, $2, $3)",
      [name, email, hashpassword]
    );
    
    // Create JWT token
    const token = jwt.sign(
      { userId: name }, 
      process.env.JWT_SECRET || "blogifysecretkey",
      { expiresIn: "7d" }
    );
    
    console.log("User signed up:", name);
    res.status(201).json({
      message: "Signup successful",
      token,
      user: {
        username: name,
        email: email
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      error: error.message || "Signup failed"
    });
  }
};

module.exports = { signincontroller };
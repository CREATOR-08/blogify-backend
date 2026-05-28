const pool = require("../models/usermodel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const logincontroller = async (req, res) => {
  try {
    const { name, password } = req.body;
    //get the password from db
    const result = await pool.query(
      "SELECT password FROM BloggerData WHERE username=$1",
      [name],
    );
    //if name not found show errr
    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    // match password using bcrypt
    const dbpassword = result.rows[0].password;
    const match = await bcrypt.compare(password, dbpassword);

    if (!match) {
      return res.status(401).json({
        message: "Invalid password",
      });
    }
    //give all the posts of the logged in user
    const posts = await pool.query("SELECT * FROM posts WHERE name=$1", [name]);
    const token = jwt.sign({ userId: name }, "blogifysecretkey", {
      expiresIn: "1d",
    });

    res.status(200).json({
      message: "success",
      token,
      posts: posts.rows,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};

module.exports = { logincontroller };

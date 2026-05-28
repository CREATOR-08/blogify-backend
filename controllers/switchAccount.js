const pool = require("../models/usermodel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const switchAccount = async (req, res) => {
  try {
    const currentUsername = req.user?.userId;
    const { targetUsername, password } = req.body;

    if (!currentUsername) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (!targetUsername || !password) {
      return res.status(400).json({ message: "Target username and password are required." });
    }

    const currentUserResult = await pool.query(
      "SELECT email FROM BloggerData WHERE username=$1",
      [currentUsername]
    );

    if (currentUserResult.rows.length === 0) {
      return res.status(404).json({ message: "Current user not found." });
    }

    const targetUserResult = await pool.query(
      "SELECT username, email, password FROM BloggerData WHERE username=$1",
      [targetUsername]
    );

    if (targetUserResult.rows.length === 0) {
      return res.status(404).json({ message: "Target account not found." });
    }

    const targetUser = targetUserResult.rows[0];
    if (targetUser.email !== currentUserResult.rows[0].email) {
      return res.status(403).json({ message: "Target account must use the same email." });
    }

    const isMatch = await bcrypt.compare(password, targetUser.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password for the selected account." });
    }

    const token = jwt.sign({ userId: targetUser.username }, "blogifysecretkey", {
      expiresIn: "1d",
    });

    res.json({ message: "Switched account successfully.", token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = switchAccount;

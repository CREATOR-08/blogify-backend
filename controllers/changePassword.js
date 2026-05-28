const pool = require("../models/usermodel");
const bcrypt = require("bcrypt");

const changePassword = async (req, res) => {
  try {
    const username = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!username) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required." });
    }

    const userResult = await pool.query(
      "SELECT password FROM BloggerData WHERE username=$1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const savedHash = userResult.rows[0].password;
    const isMatch = await bcrypt.compare(currentPassword, savedHash);

    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE BloggerData SET password=$1 WHERE username=$2",
      [hashedPassword, username]
    );

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = changePassword;

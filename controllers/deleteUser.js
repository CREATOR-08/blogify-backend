const pool = require("../models/usermodel");

const deleteUser = async (req, res) => {
  try {
    const username = req.user?.userId;

    if (!username) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const deleteResult = await pool.query(
      "DELETE FROM BloggerData WHERE username=$1 RETURNING username",
      [username]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    await pool.query(
      "DELETE FROM preferences WHERE name=$1",
      [username]
    );

    await pool.query(
      "DELETE FROM stats WHERE name=$1",
      [username]
    );

    await pool.query(
      "UPDATE preferences SET subscribed_blogger = array_remove(COALESCE(subscribed_blogger, ARRAY[]::text[]), $1) WHERE $1 = ANY(subscribed_blogger)",
      [username]
    );

    res.json({ message: "Account deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = deleteUser;

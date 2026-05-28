const pool = require("../models/usermodel");

const checkSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user.userId;

    const postResult = await pool.query(
      "SELECT * FROM posts WHERE id=$1",
      [id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ message: "Blog not found." });
    }

    const bloggerName = postResult.rows[0].name;
    const subscriberRow = await pool.query(
      "SELECT subscribed FROM subscribed WHERE name=$1",
      [currentUser]
    );

    const isSubscribed =
      subscriberRow.rows.length > 0 &&
      (subscriberRow.rows[0].subscribed || []).includes(bloggerName);

    res.json({ subscribed: isSubscribed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = checkSubscription;

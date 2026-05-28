const pool = require("../models/usermodel");
const { addUniqueTextToPreferences, removeTextFromPreferences } = require("./preferencesHelper");

const subscribeBlogger = async (req, res) => {
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
    if (!bloggerName) {
      return res.status(400).json({ message: "Unable to determine blogger." });
    }

    if (bloggerName === currentUser) {
      return res.status(400).json({ message: "You cannot subscribe to yourself." });
    }

    // Check if user is already subscribed
    const userPrefs = await pool.query(
      "SELECT subscribed_blogger FROM preferences WHERE name=$1",
      [currentUser]
    );

    if (userPrefs.rows.length > 0) {
      const subscribed = userPrefs.rows[0].subscribed_blogger || [];
      if (subscribed.includes(bloggerName)) {
        return res.status(400).json({ 
          message: "You are already subscribed to this blogger.",
          isSubscribed: true
        });
      }
    }

    const statsResult = await pool.query(
      "SELECT * FROM stats WHERE name=$1",
      [bloggerName]
    );

    let updatedStats;
    if (statsResult.rows.length === 0) {
      updatedStats = await pool.query(
        "INSERT INTO stats(name, total_likes, subscribers_count, badges) VALUES ($1, 0, 1, ARRAY[]::text[]) RETURNING *",
        [bloggerName]
      );
    } else {
      updatedStats = await pool.query(
        "UPDATE stats SET subscribers_count = subscribers_count + 1 WHERE name=$1 RETURNING *",
        [bloggerName]
      );
    }

    await addUniqueTextToPreferences(currentUser, "subscribed_blogger", bloggerName);

    res.json({
      message: "Subscribed successfully.",
      stats: updatedStats.rows[0],
      isSubscribed: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = subscribeBlogger;

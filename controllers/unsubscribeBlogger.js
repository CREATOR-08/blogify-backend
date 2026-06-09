const pool = require("../models/usermodel");
const { removeTextFromPreferences } = require("./preferencesHelper");

const unsubscribeBlogger = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user?.userId;

    if (!currentUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Get post to find blogger
    const postResult = await pool.query(
      "SELECT name FROM posts WHERE id=$1",
      [id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: "Blog not found" });
    }

    const bloggerName = postResult.rows[0].name;
    if (!bloggerName) {
      return res.status(400).json({ error: "Unable to determine blogger" });
    }

    // Check if user is subscribed
    const userPrefs = await pool.query(
      "SELECT subscribed_blogger FROM preferences WHERE name=$1",
      [currentUser]
    );

    if (userPrefs.rows.length === 0) {
      return res.status(400).json({ 
        error: "You are not subscribed to this blogger",
        isSubscribed: false
      });
    }

    const subscribed = userPrefs.rows[0].subscribed_blogger || [];
    if (!subscribed.includes(bloggerName)) {
      return res.status(400).json({ 
        error: "You are not subscribed to this blogger",
        isSubscribed: false
      });
    }

    // Update blogger's subscriber count
    const statsResult = await pool.query(
      "SELECT * FROM stats WHERE name=$1",
      [bloggerName]
    );

    let updatedStats;
    if (statsResult.rows.length > 0 && statsResult.rows[0].subscribers_count > 0) {
      updatedStats = await pool.query(
        "UPDATE stats SET subscribers_count = subscribers_count - 1 WHERE name=$1 RETURNING *",
        [bloggerName]
      );
    } else {
      updatedStats = statsResult.rows[0] || { subscribers_count: 0 };
    }

    // Remove from user's subscribed list
    await removeTextFromPreferences(currentUser, "subscribed_blogger", bloggerName);

    res.json({
      message: "Unsubscribed successfully",
      stats: updatedStats.rows?.[0] || updatedStats,
      isSubscribed: false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = unsubscribeBlogger;

    res.json({
      message: "Unsubscribed successfully.",
      stats: updatedStats.rows ? updatedStats.rows[0] : updatedStats,
      isSubscribed: false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = unsubscribeBlogger;

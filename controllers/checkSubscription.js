const pool = require("../models/usermodel");

const checkSubscription = async (req, res) => {
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

    // Check if current user is subscribed to the blogger
    const userPrefs = await pool.query(
      "SELECT subscribed_blogger FROM preferences WHERE name=$1",
      [currentUser]
    );

    const isSubscribed =
      userPrefs.rows.length > 0 &&
      (userPrefs.rows[0].subscribed_blogger || []).includes(bloggerName);

    res.json({ 
      isSubscribed,
      blogger: bloggerName
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = checkSubscription;

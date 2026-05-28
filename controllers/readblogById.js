const pool = require("../models/usermodel");

const readblogById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user?.userId; // This is the username from JWT

    const result = await pool.query(
      `SELECT posts.*, COALESCE(stats.total_likes, 0) AS total_likes
       FROM posts
       LEFT JOIN stats ON posts.name = stats.name
       WHERE posts.id=$1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Blog not found." });
    }

    let hasLiked = false;
    let isSubscribed = false;

    if (currentUser) {
      const userPrefs = await pool.query(
        "SELECT liked, subscribed_blogger FROM preferences WHERE name=$1",
        [currentUser]
      );

      if (userPrefs.rows.length > 0) {
        const prefs = userPrefs.rows[0];
        hasLiked = prefs.liked && prefs.liked.includes(parseInt(id));
        isSubscribed = prefs.subscribed_blogger && prefs.subscribed_blogger.includes(result.rows[0].name);
      }
    }

    res.json({ 
      post: result.rows[0],
      hasLiked,
      isSubscribed
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = readblogById;

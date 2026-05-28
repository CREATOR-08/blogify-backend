const pool = require("../models/usermodel");
const { addUniqueIntToPreferences } = require("./preferencesHelper");

const likesPost = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user?.userId;

    const postResult = await pool.query(
      "SELECT * FROM posts WHERE id=$1",
      [id]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ message: "Blog not found." });
    }

    // Check if user has already liked this post
    if (currentUser) {
      const userPrefs = await pool.query(
        "SELECT liked FROM preferences WHERE name=$1",
        [currentUser]
      );

      if (userPrefs.rows.length > 0) {
        const liked = userPrefs.rows[0].liked || [];
        if (liked.includes(parseInt(id))) {
          return res.status(400).json({ 
            message: "You have already liked this blog.",
            hasLiked: true
          });
        }
      }
    }

    const bloggerName = postResult.rows[0].name;

    const statsResult = await pool.query(
      "SELECT * FROM stats WHERE name=$1",
      [bloggerName]
    );

    let updatedStats;
    if (statsResult.rows.length === 0) {
      updatedStats = await pool.query(
        "INSERT INTO stats(name, total_likes, subscribers_count, badges) VALUES ($1, 1, 0, ARRAY[]::text[]) RETURNING *",
        [bloggerName]
      );
    } else {
      updatedStats = await pool.query(
        "UPDATE stats SET total_likes = total_likes + 1 WHERE name=$1 RETURNING *",
        [bloggerName]
      );
    }

    if (currentUser) {
      await addUniqueIntToPreferences(currentUser, "liked", id);
    }

    res.json({ 
      post: postResult.rows[0], 
      stats: updatedStats.rows[0],
      hasLiked: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = likesPost;

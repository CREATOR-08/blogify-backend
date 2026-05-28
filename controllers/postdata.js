const pool = require("../models/usermodel");


const postdata = async (req, res) => {
  try {
    const username = req.user.userId;
    const userResult = await pool.query(
      "SELECT username FROM BloggerData WHERE username=$1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const postsResult = await pool.query(
      "SELECT * FROM posts WHERE name=$1",
      [username]
    );

    const statsResult = await pool.query(
      "SELECT total_likes, subscribers_count FROM stats WHERE name=$1",
      [username]
    );

    res.json({
      username: userResult.rows[0].username,
      posts: postsResult.rows,
      stats: {
        totalLikes: statsResult.rows[0]?.total_likes ?? 0,
        subscriberCount: statsResult.rows[0]?.subscribers_count ?? 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = postdata;
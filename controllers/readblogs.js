const jwt = require("jsonwebtoken");
const pool = require("../models/usermodel");
const { addUniqueTextToPreferences } = require("./preferencesHelper");

const readblogs = async (req, res) => {
  try {
    const search = req.query.q?.trim();
    let username = null;

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      try {
        const decoded = jwt.verify(token, "blogifysecretkey");
        username = decoded.userId;
      } catch (err) {
        username = null;
      }
    }

    if (search && username) {
      await addUniqueTextToPreferences(username, "searched", search);
    }

    let query;
    let values = [];

    if (search) {
      query = `SELECT posts.*, COALESCE(stats.total_likes, 0) AS total_likes
           FROM posts
           LEFT JOIN stats ON posts.name = stats.name
           WHERE posts.title ILIKE $1
           OR posts.content ILIKE $1
           OR COALESCE(posts.topic, '') ILIKE $1
           ORDER BY posts.created_at DESC
           LIMIT 5`;
      values = [`%${search}%`];
    } else {
      query = `SELECT posts.*, COALESCE(stats.total_likes, 0) AS total_likes
               FROM posts
               LEFT JOIN stats ON posts.name = stats.name
               ORDER BY RANDOM()
               LIMIT 10`;
    }

    const posts = await pool.query(query, values);
    res.json({ posts: posts.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const readTrending = async (req, res) => {
  try {
    const query = `SELECT posts.*, COALESCE(stats.total_likes, 0) AS total_likes
                   FROM posts
                   LEFT JOIN stats ON posts.name = stats.name
                   ORDER BY COALESCE(stats.total_likes, 0) DESC, posts.created_at DESC
                   LIMIT 6`;
    const posts = await pool.query(query);
    res.json({ posts: posts.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  readblogs,
  readTrending,
};

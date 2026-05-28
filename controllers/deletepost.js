const pool = require("../models/usermodel");

const deletepost = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.user?.userId;

    const columnsResult = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'posts'`
    );
    const columns = columnsResult.rows.map((row) => row.column_name);

    if (!columns.includes("id")) {
      return res.status(500).json({ message: "No valid post id column found." });
    }

    const result = await pool.query(
      `DELETE FROM posts WHERE id=$1 AND name=$2 RETURNING *`,
      [id, owner]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Post not found or you do not have permission to delete it." });
    }

    res.json({ message: "Post deleted." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = deletepost;

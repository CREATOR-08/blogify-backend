const pool = require("../models/usermodel");

const updatepost = async (req, res) => {
  try {
    const { id } = req.params;
    const owner = req.user?.userId;
    const { title, content, topic, ageRestriction } = req.body;

    if (!title && !content && !topic && !ageRestriction) {
      return res.status(400).json({ message: "No fields provided to update." });
    }

    const columnsResult = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'posts'`
    );
    const columns = columnsResult.rows.map((row) => row.column_name);

    if (!columns.includes("id")) {
      return res.status(500).json({ message: "No valid post id column found." });
    }

    const fieldMapping = [
      { col: "title", value: title },
      { col: "content", value: content },
      { col: "topic", value: topic },
      { col: "age_restriction", value: ageRestriction },
    ].filter((field) => columns.includes(field.col) && field.value != null);

    if (fieldMapping.length === 0) {
      return res.status(400).json({ message: "No updatable fields found." });
    }

    const setClauses = fieldMapping.map((field, idx) => `${field.col}=$${idx + 1}`);
    const values = fieldMapping.map((field) => field.value);
    values.push(id, owner);

    const query = `UPDATE posts SET ${setClauses.join(", ")} WHERE id=$${values.length - 1} AND name=$${values.length} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Post not found or you do not have permission to edit it." });
    }

    res.json({ post: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = updatepost;

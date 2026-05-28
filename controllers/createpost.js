const pool = require("../models/usermodel");

const createpost = async (req, res) => {
  try {
    const { title, content, topic, ageRestriction } = req.body;
    const author = req.user?.userId;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required." });
    }

    const columnsResult = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'posts'`
    );
    const columns = columnsResult.rows.map((row) => row.column_name);

    const insertFields = [];
    const values = [];

    const fieldMapping = [
      { col: "name", value: author },
      { col: "title", value: title },
      { col: "content", value: content },
      { col: "topic", value: topic || null },
      { col: "age_restriction", value: ageRestriction || null },
    ];

    fieldMapping.forEach((field) => {
      if (columns.includes(field.col)) {
        insertFields.push(field.col);
        values.push(field.value);
      }
    });

    if (insertFields.length === 0) {
      return res.status(500).json({ message: "No supported post fields available in the database." });
    }

    const placeholders = insertFields.map((_, idx) => `$${idx + 1}`).join(", ");
    const insertQuery = `INSERT INTO posts(${insertFields.join(", ")}) VALUES(${placeholders}) RETURNING *`;
    const result = await pool.query(insertQuery, values);

    res.status(201).json({ post: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = createpost;

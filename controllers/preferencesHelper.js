const pool = require("../models/usermodel");

const ensurePreferencesTableExists = async () => {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS preferences (
      name TEXT PRIMARY KEY,
      liked INT[] DEFAULT ARRAY[]::INT[],
      subscribed_blogger TEXT[] DEFAULT ARRAY[]::TEXT[],
      viewed INT[] DEFAULT ARRAY[]::INT[],
      searched TEXT[] DEFAULT ARRAY[]::TEXT[]
    )`
  );
};

const ensurePreferencesRow = async (username) => {
  await ensurePreferencesTableExists();

  const result = await pool.query(
    "SELECT * FROM preferences WHERE name=$1",
    [username]
  );

  if (result.rows.length === 0) {
    await pool.query(
      "INSERT INTO preferences(name, liked, subscribed_blogger, viewed, searched) VALUES ($1, ARRAY[]::int[], ARRAY[]::text[], ARRAY[]::int[], ARRAY[]::text[])",
      [username]
    );
    return {
      name: username,
      liked: [],
      subscribed_blogger: [],
      viewed: [],
      searched: [],
    };
  }

  return result.rows[0];
};

const addUniqueIntToPreferences = async (username, column, value) => {
  const preferences = await ensurePreferencesRow(username);
  const normalized = parseInt(value, 10);
  if (Number.isNaN(normalized)) {
    return;
  }

  if (!preferences[column]?.includes(normalized)) {
    await pool.query(
      `UPDATE preferences SET ${column} = array_append(COALESCE(${column}, ARRAY[]::int[]), $1) WHERE name=$2`,
      [normalized, username]
    );
  }
};

const addUniqueTextToPreferences = async (username, column, value) => {
  const preferences = await ensurePreferencesRow(username);
  const normalized = value?.trim();
  if (!normalized) {
    return;
  }

  if (!preferences[column]?.includes(normalized)) {
    await pool.query(
      `UPDATE preferences SET ${column} = array_append(COALESCE(${column}, ARRAY[]::text[]), $1) WHERE name=$2`,
      [normalized, username]
    );
  }
};

const removeTextFromPreferences = async (username, column, value) => {
  const normalized = value?.trim();
  if (!normalized) {
    return;
  }

  await pool.query(
    `UPDATE preferences SET ${column} = array_remove(COALESCE(${column}, ARRAY[]::text[]), $1) WHERE name=$2`,
    [normalized, username]
  );
};

module.exports = {
  ensurePreferencesRow,
  addUniqueIntToPreferences,
  addUniqueTextToPreferences,
  removeTextFromPreferences,
};

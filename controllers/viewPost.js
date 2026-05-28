const { addUniqueIntToPreferences } = require("./preferencesHelper");

const viewPost = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user?.userId;

    if (!currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await addUniqueIntToPreferences(currentUser, "viewed", id);
    res.json({ message: "View recorded." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = viewPost;

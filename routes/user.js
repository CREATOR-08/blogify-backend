const express = require("express");
const auth = require("../middleware/auth");
const changePassword = require("../controllers/changePassword");
const deleteUser = require("../controllers/deleteUser");
const switchAccount = require("../controllers/switchAccount");

const router = express.Router();

router.post("/change-password", auth, changePassword);
router.post("/switch-account", auth, switchAccount);
router.delete("/", auth, deleteUser);

module.exports = router;

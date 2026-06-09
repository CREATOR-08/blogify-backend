const express = require("express")
const { signincontroller } = require("../controllers/signincontroller")
const { logincontroller } = require("../controllers/logincontroller")
const auth = require("../middleware/auth")
const postdata = require("../controllers/postdata")

const router = express.Router()

// Authentication routes
router.post("/signup", signincontroller)
router.post("/login", logincontroller)

// Get current user's posts
router.get("/myposts", auth, postdata)

module.exports = router
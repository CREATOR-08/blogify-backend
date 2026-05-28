const express = require("express")
const { signincontroller } = require("../controllers/signincontroller")
const { logincontroller } = require("../controllers/logincontroller")

const auth = require("../middleware/auth")
const postdata = require("../controllers/postdata")

const router = express.Router()

router.post("/signup", signincontroller)
router.get("/signup",auth,(req,res)=>{res.send("hello")})
router.post("/login",logincontroller)
router.post("/login",logincontroller)
router.get("/myposts",auth,postdata)
module.exports = router
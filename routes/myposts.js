const express=require('express');
const postdata = require('../controllers/postdata');
const getMyPostById = require('../controllers/getMyPostById');
const updatepost = require('../controllers/updatepost');
const deletepost = require('../controllers/deletepost');
const auth = require('../middleware/auth');
const postrouter=express.Router();

postrouter.get("/myposts",auth,postdata)
postrouter.get("/myposts/:id", auth, getMyPostById)
postrouter.put("/myposts/:id", auth, updatepost)
postrouter.delete("/myposts/:id", auth, deletepost)

module.exports=postrouter
const pool=require("../models/usermodel")
const bcrypt=require("bcrypt");


const signincontroller = async (req, res) => {
  try {
    const {name,email,password} = req.body
    const hashpassword=await bcrypt.hash(password,10);
    await pool.query(
      "INSERT INTO Bloggerdata(username,email,password) VALUES($1,$2,$3)",
      [name,email,hashpassword]
    )
    console.log(name);
    res.status(200).json({
      msg:"working"
    })
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

module.exports = { signincontroller };
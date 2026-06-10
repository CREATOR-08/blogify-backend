const express = require("express");
const currentEvents = require("../controllers/currentEvents");

const router = express.Router();

router.post("/current-events", currentEvents);

module.exports = router;

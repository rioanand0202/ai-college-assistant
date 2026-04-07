const express = require("express");
const { generalChat } = require("../controllers/ai.controller");

const router = express.Router();

router.post("/general", generalChat);

module.exports = router;

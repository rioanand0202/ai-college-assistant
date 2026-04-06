const express = require("express");
const { listActivityLogs } = require("../controllers/activityLog.controller");

const router = express.Router();

router.get("/", listActivityLogs);

module.exports = router;

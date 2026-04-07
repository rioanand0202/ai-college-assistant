const express = require("express");
const { requireOAuthAuth } = require("../middlewares/oauthAuth.middleware");
const { listHistory } = require("../controllers/chat.controller");

const router = express.Router();

router.get("/history", requireOAuthAuth, listHistory);

module.exports = router;

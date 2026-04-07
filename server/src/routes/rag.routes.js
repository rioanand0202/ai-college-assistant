const express = require("express");
const { queryRag, searchChunks } = require("../controllers/rag.controller");

const router = express.Router();

router.post("/query", queryRag);
router.post("/search", searchChunks);

module.exports = router;

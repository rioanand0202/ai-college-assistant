const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "API Working 🚀" });
});

// Future modules
// router.use("/auth", require("./auth.routes"));
// router.use("/chat", require("./chat.routes"));

module.exports = router;

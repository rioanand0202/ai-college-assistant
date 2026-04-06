const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth.middleware");

router.use("/auth", require("./auth.routes"));
router.use(requireAuth);
router.use("/activity-logs", require("./activityLog.routes"));

router.get("/", (req, res) => {
  res.json({ message: "API Working 🚀" });
});

module.exports = router;

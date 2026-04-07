const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth.middleware");
const { getMeta } = require("../controllers/meta.controller");

router.use("/auth", require("./auth.routes"));
router.get("/meta", getMeta);
router.use(requireAuth);
router.use("/activity-logs", require("./activityLog.routes"));
router.use("/materials", require("./materials.routes"));
router.use("/ai", require("./ai.routes"));
router.use("/admin", require("./admin.routes"));

router.get("/", (req, res) => {
  res.json({ message: "API Working 🚀" });
});

module.exports = router;

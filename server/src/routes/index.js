const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth.middleware");
const { optionalOAuthAuth } = require("../middlewares/oauthAuth.middleware");
const { getMeta } = require("../controllers/meta.controller");
const { publicAsk } = require("../controllers/public.controller");
const { listPublicSuggestions } = require("../controllers/publicSuggestions.controller");
const {
  listPublicEventAnnouncements,
} = require("../controllers/eventAnnouncement.controller");

router.use("/auth", require("./auth.routes"));
router.get("/meta", getMeta);

/** Public events — deactivates expired then lists active for collegeCode */
router.get("/public/events", listPublicEventAnnouncements);

/** Public RAG assistant — no college JWT; optional OAuth Bearer saves chat history */
router.get("/public/suggestions", listPublicSuggestions);
router.post("/public/ask", optionalOAuthAuth, publicAsk);
router.use("/chat", require("./chat.routes"));

router.use(requireAuth);
router.use("/activity-logs", require("./activityLog.routes"));
router.use("/materials", require("./materials.routes"));
router.use("/ai", require("./ai.routes"));
router.use("/rag", require("./rag.routes"));
router.use("/admin", require("./admin.routes"));

router.get("/", (req, res) => {
  res.json({ message: "API Working 🚀" });
});

module.exports = router;

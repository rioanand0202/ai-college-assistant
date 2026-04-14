const express = require("express");
const requireRole = require("../middlewares/requireRole.middleware");
const validateBody = require("../middlewares/validate.middleware");
const {
  listPendingStaff,
  approveStaffById,
  rejectStaffById,
} = require("../controllers/admin.controller");
const {
  createEventAnnouncement,
  listAdminEventAnnouncements,
} = require("../controllers/eventAnnouncement.controller");
const { createEventAnnouncementSchema } = require("../validators/eventAnnouncement.validator");
const { ROLE } = require("../utils/constants");

const router = express.Router();

router.get(
  "/staff/pending",
  requireRole(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  listPendingStaff,
);
router.patch(
  "/staff/:id/approve",
  requireRole(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  approveStaffById,
);
router.patch(
  "/staff/:id/reject",
  requireRole(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  rejectStaffById,
);

router.get(
  "/events",
  requireRole(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  listAdminEventAnnouncements,
);
router.post(
  "/events",
  requireRole(ROLE.ADMIN, ROLE.SUPER_ADMIN),
  validateBody(createEventAnnouncementSchema),
  createEventAnnouncement,
);

module.exports = router;

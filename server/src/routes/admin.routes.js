const express = require("express");
const requireRole = require("../middlewares/requireRole.middleware");
const {
  listPendingStaff,
  approveStaffById,
  rejectStaffById,
} = require("../controllers/admin.controller");
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

module.exports = router;

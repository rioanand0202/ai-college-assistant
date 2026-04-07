const Users = require("../models/Users.model");
const { USER_STATUS } = require("../utils/constants");

/** One-time style migration for legacy `staffApproved` and missing `status`. */
const migrateUserStatusFields = async () => {
  const col = Users.collection;

  await col.updateMany(
    { role: "staff", staffApproved: false },
    { $set: { status: USER_STATUS.PENDING }, $unset: { staffApproved: "" } },
  );

  await col.updateMany(
    { staffApproved: true },
    { $set: { status: USER_STATUS.APPROVED }, $unset: { staffApproved: "" } },
  );

  await col.updateMany(
    { status: { $exists: false } },
    { $set: { status: USER_STATUS.APPROVED } },
  );
};

module.exports = { migrateUserStatusFields };

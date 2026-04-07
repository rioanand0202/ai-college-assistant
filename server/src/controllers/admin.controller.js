const mongoose = require("mongoose");
const Users = require("../models/Users.model");
const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const { ROLE, USER_STATUS } = require("../utils/constants");
const { asyncHookFun, commitActivityLog } = require("../context/requestContext");

const sameCollege = (adminCc, userCc) =>
  String(adminCc || "").toUpperCase() === String(userCc || "").toUpperCase();

const listPendingStaff = catchAsync(async (pick, res) => {
  const { req } = pick;
  asyncHookFun(req);

  const staff = await Users.find({
    role: ROLE.STAFF,
    status: USER_STATUS.PENDING,
    collegeCode: req.user.collegeCode,
  })
    .select("name email collegeCode status createdAt")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ success: true, data: { staff } });
});

const approveStaffById = catchAsync(async (pick, res) => {
  const { req, params } = pick;
  asyncHookFun(req);

  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(String(id))) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await Users.findById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (user.role !== ROLE.STAFF) {
    throw new AppError("Only staff can be approved here", 400);
  }
  if (!sameCollege(req.user.collegeCode, user.collegeCode)) {
    throw new AppError("Forbidden", 403);
  }

  user.status = USER_STATUS.APPROVED;
  await user.save();

  commitActivityLog({
    summary: "Staff approved",
    userId: req.user.id,
    userEmail: req.user.email,
    userName: req.user.name,
  });

  res.status(200).json({
    success: true,
    message: "Staff approved",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    },
  });
});

const rejectStaffById = catchAsync(async (pick, res) => {
  const { req, params } = pick;
  asyncHookFun(req);

  const id = params.id;
  if (!mongoose.Types.ObjectId.isValid(String(id))) {
    throw new AppError("Invalid user id", 400);
  }

  const user = await Users.findById(id);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (user.role !== ROLE.STAFF) {
    throw new AppError("Only staff can be rejected here", 400);
  }
  if (!sameCollege(req.user.collegeCode, user.collegeCode)) {
    throw new AppError("Forbidden", 403);
  }

  user.status = USER_STATUS.REJECTED;
  await user.save();

  commitActivityLog({
    summary: "Staff rejected",
    userId: req.user.id,
    userEmail: req.user.email,
    userName: req.user.name,
  });

  res.status(200).json({
    success: true,
    message: "Staff rejected",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    },
  });
});

module.exports = { listPendingStaff, approveStaffById, rejectStaffById };
